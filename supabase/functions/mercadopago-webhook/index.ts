// Supabase Edge Function: mercadopago-webhook
// Recebe, verifica HMAC x-signature, consulta a API oficial e armazena o evento.
// IMPORTANTE: NÃO ativa loja nem altera assinatura sem vínculo seguro de checkout.
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
}

async function validSignature(request: Request, resourceId: string, secret: string): Promise<boolean> {
  const signature = request.headers.get('x-signature') ?? '';
  const requestId = request.headers.get('x-request-id') ?? '';
  const values = Object.fromEntries(signature.split(',').map(x => x.trim().split('=', 2)));
  const ts = values.ts;
  const received = values.v1;
  if (!ts || !received || !/^[a-f0-9]{64}$/i.test(received) || !requestId) return false;
  // Evita replays antigos. Mercado Pago fornece timestamp Unix em segundos.
  const seconds = Number(ts);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 600) return false;
  const manifest = `id:${resourceId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const calculated = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)));
  // Comparação sem early-return por caractere.
  if (calculated.length !== received.length) return false;
  let mismatch = 0;
  for (let i = 0; i < calculated.length; i++) mismatch |= calculated.charCodeAt(i) ^ received.toLowerCase().charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const collectorExpected = Deno.env.get('MERCADOPAGO_COLLECTOR_ID');
  if (!token || !secret || !supabaseUrl || !serviceKey || !collectorExpected) {
    console.error('Mercado Pago configuration incomplete');
    return json({ error: 'configuration_incomplete' }, 503);
  }

  const url = new URL(request.url);
  let notification: Record<string, unknown>;
  try { notification = await request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const data = notification.data as Record<string, unknown> | undefined;
  const resourceId = url.searchParams.get('data.id') || String(data?.id || '');
  const topic = String(notification.type || url.searchParams.get('type') || '');
  if (!resourceId || !/^[a-zA-Z0-9_-]{1,100}$/.test(resourceId)) return json({ error: 'invalid_resource_id' }, 400);
  if (!(await validSignature(request, resourceId, secret))) return json({ error: 'invalid_signature' }, 401);

  const endpoints: Record<string, string> = {
    payment: `/v1/payments/${resourceId}`,
    subscription_preapproval: `/preapproval/${resourceId}`,
    subscription_authorized_payment: `/authorized_payments/${resourceId}`,
    subscription_preapproval_plan: `/preapproval_plan/${resourceId}`,
  };
  if (!Object.hasOwn(endpoints, topic)) return json({ accepted: true, ignored: true });

  const response = await fetch(`https://api.mercadopago.com${endpoints[topic]}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    console.error('Failed to check MP resource', topic, response.status);
    return json({ error: 'provider_verification_failed' }, 502);
  }
  const resource = await response.json() as Record<string, unknown>;
  const collector = resource.collector as Record<string, unknown> | undefined;
  const collectorId = String(resource.collector_id ?? collector?.id ?? '');
  if (!collectorId || collectorId !== collectorExpected) {
    console.error('Mercado Pago collector mismatch');
    return json({ error: 'collector_mismatch' }, 403);
  }

  const recurring = resource.auto_recurring as Record<string, unknown> | undefined;
  const entry = {
    // Chave idempotente: o mesmo recurso pode mudar de status; chave por status.
    event_key: `${topic}:${resourceId}:${String(resource.status || 'unknown')}`,
    event_type: topic,
    resource_id: resourceId,
    resource_status: String(resource.status || ''),
    collector_id: collectorId,
    external_reference: resource.external_reference ? String(resource.external_reference) : null,
    mp_subscription_id: resource.preapproval_id ? String(resource.preapproval_id) : topic === 'subscription_preapproval' ? resourceId : null,
    mp_plan_id: resource.preapproval_plan_id ? String(resource.preapproval_plan_id) : null,
    amount: typeof resource.transaction_amount === 'number'
      ? resource.transaction_amount
      : typeof recurring?.transaction_amount === 'number' ? recurring.transaction_amount : null,
    currency: String(resource.currency_id || recurring?.currency_id || 'BRL'),
    payload: resource,
    reconciliation_status: 'pending',
  };
  const db = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await db.from('fcs_mp_webhook_events').upsert(entry, { onConflict: 'event_key', ignoreDuplicates: true });
  if (error) {
    console.error('Failed to save verified MP event', error.code);
    return json({ error: 'storage_failed' }, 503);
  }
  return json({ accepted: true });
});
