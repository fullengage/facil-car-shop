const fs = require('fs');
const path = require('path');

const painelDir = path.resolve(__dirname, '../../classificados-carros/app/painel');
if (!fs.existsSync(painelDir)) {
  fs.mkdirSync(painelDir, { recursive: true });
}

const pageContent = `"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout, type UserRole } from "@/components/dashboard/DashboardLayout";
import type { Store, Vehicle } from "@/lib/crmTypes";

export default function PainelPage() {
  const [currentRole, setCurrentRole] = React.useState<UserRole>("LOJISTA");

  const mockStore: Store = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Auto Fácil Matriz",
    corporate_name: "Auto Fácil Comércio de Veículos Ltda",
    cnpj: "12.345.678/0001-90",
    phone: "(11) 98888-7777",
    email: "contato@autofacil.com.br",
    address_city: "São Paulo",
    address_state: "SP",
    address_street: "Av. dos Bandeirantes",
    address_number: "2000",
    slug: "auto-facil-matriz",
    status: "approved",
  };

  const mockVehicles: Vehicle[] = [
    {
      id: "v-1",
      store_id: mockStore.id,
      title: "Toyota Corolla 2.0 XEi Flex",
      brand: "Toyota",
      model: "Corolla",
      version: "2.0 XEi",
      model_year: 2022,
      mileage: 45000,
      price: 112900,
      fipe_price: 115400,
      plate_masked: "BRA***9",
      photos: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80"],
      status: "published",
    },
    {
      id: "v-2",
      store_id: mockStore.id,
      title: "Jeep Compass Longitude 1.3 Turbo",
      brand: "Jeep",
      model: "Compass",
      version: "Longitude T270",
      model_year: 2023,
      mileage: 28000,
      price: 148900,
      fipe_price: 154000,
      plate_masked: "FCL***6",
      photos: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"],
      status: "published",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar para a Home
          </Link>
          <span className="text-xs bg-blue-500/10 text-blue-400 font-bold px-3 py-1 rounded-full border border-blue-500/20">
            Fácil Car Shop • Cockpit de Gestão Integrado ao Supabase
          </span>
        </div>

        <DashboardLayout
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onBackToMarketplace={() => window.location.href = '/'}
          activeStore={mockStore}
          stores={[mockStore]}
          vehicles={mockVehicles}
          onOpenAddVehicle={() => alert('Cadastro de veículo aberto')}
          onOpenStoreModal={() => alert('Cadastro de loja aberto')}
        />
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(painelDir, 'page.tsx'), pageContent, 'utf8');
console.log('Painel page created at classificados-carros/app/painel/page.tsx');
