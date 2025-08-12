// src/pages/CustomDashboard.tsx

import React, { useState, useEffect } from 'react';
import HtmlJsSectionManager from "../components/htmljs/HtmlJsSectionManager";
import { useApp } from '@/contexts/AppContext';

// Esta é a interface que define a estrutura de uma seção.
interface SectionDefinition {
    id: string;
    title: string;
    htmlContent: string;
    jsContent?: string;
    supabaseAccess?: boolean;
}

const CustomDashboard = () => {
    const { isAuthReady, transactions, goals } = useApp();
    const [dashboardSections, setDashboardSections] = useState<SectionDefinition[]>([]);
    const [loadingSections, setLoadingSections] = useState(true);

    // O useEffect agora será executado de forma confiável após a autenticação e os dados serem carregados
    useEffect(() => {
        // A condição "isAuthReady" garante que não tentaremos renderizar antes da verificação inicial de autenticação.
        if (isAuthReady) {
            const newSections: SectionDefinition[] = [];

            // Adiciona a seção de Resumo de Transações
            newSections.push({
                id: "resumo-transacoes",
                title: "Resumo de Transações",
                htmlContent: `
                    <div class="p-4 bg-blue-100 rounded-lg shadow-inner flex flex-col items-center justify-center">
                        <h4 class="text-xl font-bold text-blue-800">Saldo Atual</h4>
                        <p class="text-3xl font-extrabold mt-2 text-blue-900" id="saldo-valor">...</p>
                    </div>
                `,
                jsContent: `
                    const saldoElement = document.getElementById('saldo-valor');
                    if (saldoElement) {
                        if (section.appData.transactions && section.appData.transactions.length > 0) {
                            const saldoTotal = section.appData.transactions.reduce((acc, t) => acc + t.amount, 0);
                            saldoElement.innerText = section.utils.formatCurrency(saldoTotal);
                            saldoElement.classList.remove('text-sm');
                            saldoElement.classList.add('text-3xl', 'font-extrabold');
                        } else {
                            saldoElement.innerText = "Nenhuma transação encontrada.";
                            saldoElement.classList.remove('text-3xl', 'font-extrabold');
                            saldoElement.classList.add('text-sm');
                        }
                    }
                `,
                supabaseAccess: false
            });

            // Adiciona a seção de Metas Financeiras
            newSections.push({
                id: "meta-financeira",
                title: "Metas Financeiras",
                htmlContent: `
                    <div class="p-4 bg-green-100 rounded-lg shadow-inner flex flex-col items-center justify-center">
                        <h4 class="text-xl font-bold text-green-800">Próxima Meta</h4>
                        <p class="text-xl font-semibold mt-2 text-green-900" id="meta-nome">...</p>
                        <p class="text-sm mt-1 text-green-700" id="meta-progresso-container">Progresso: <span id="meta-progresso">...</span></p>
                    </div>
                `,
                jsContent: `
                    const metaNomeElement = document.getElementById('meta-nome');
                    const progressoContainerElement = document.getElementById('meta-progresso-container');
                    
                    if (metaNomeElement && progressoContainerElement) {
                        if (section.appData.goals && section.appData.goals.length > 0) {
                            const firstGoal = section.appData.goals[0];
                            // CORRIGIDO: Usando 'current_amount' e 'goal_amount' conforme a interface Goal
                            const progresso = (firstGoal.current_amount / firstGoal.goal_amount) * 100;
                            
                            metaNomeElement.innerText = firstGoal.name;
                            metaNomeElement.classList.remove('text-sm');
                            metaNomeElement.classList.add('text-xl', 'font-semibold');
                            
                            const progressoElement = progressoContainerElement.querySelector('#meta-progresso');
                            if (progressoElement) {
                                progressoElement.innerText = \`\${progresso.toFixed(2)}%\`;
                            }
                            progressoContainerElement.style.display = 'block';
                        } else {
                            metaNomeElement.innerText = "Nenhuma meta definida.";
                            metaNomeElement.classList.remove('text-xl', 'font-semibold');
                            metaNomeElement.classList.add('text-sm');
                            progressoContainerElement.style.display = 'none';
                        }
                    }
                `,
                supabaseAccess: false
            });

            setDashboardSections(newSections);
            setLoadingSections(false);
        }
    }, [isAuthReady, transactions, goals]); // Dependências do useEffect

    if (loadingSections) {
        return (
            <div className="p-4 text-center text-gray-500">
                <h1 className="text-2xl font-bold mb-4">Carregando Dashboard...</h1>
            </div>
        );
    }
    
    return (
        <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <h1 className="text-2xl font-bold col-span-full">Dashboard Personalizado</h1>
            <HtmlJsSectionManager sections={dashboardSections} />
        </div>
    );
};

export default CustomDashboard;
