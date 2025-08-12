// src/pages/CustomDashboard.tsx

import React, { useState, useEffect } from 'react';
import { HtmlJsSectionManager } from "../components/htmljs/HtmlJsSectionManager";
import { useApp } from '@/contexts/AppContext';

// Esta é a interface que define a estrutura de uma seção.
// Ela é a mesma que o HtmlJsSectionManager espera.
interface SectionDefinition {
    id: string;
    title: string;
    htmlContent: string;
    jsContent?: string;
    supabaseAccess?: boolean;
}

const CustomDashboard = () => {
    // Usamos um estado para armazenar as seções dinâmicas.
    // Começa como um array vazio.
    const [dashboardSections, setDashboardSections] = useState<SectionDefinition[]>([]);
    const { isAuthReady, transactions, goals } = useApp();
    const [loadingSections, setLoadingSections] = useState(true);

    // O useEffect será executado sempre que 'isAuthReady', 'transactions' ou 'goals' mudarem.
    useEffect(() => {
        if (isAuthReady) {
            setLoadingSections(true);
            
            // Aqui, vamos construir a lista de seções com base nos dados do `appContext`.
            // Isso simula o carregamento dinâmico.
            // No seu ambiente real, você poderia buscar essa configuração de um banco de dados
            // ou de um arquivo JSON.
            const newSections: SectionDefinition[] = [];

            // Seções baseadas em transações
            if (transactions && transactions.length > 0) {
                newSections.push({
                    id: "resumo-transacoes",
                    title: "Resumo de Transações",
                    htmlContent: `
                        <div class="p-4 bg-blue-100 rounded-lg shadow-inner">
                            <h4 class="text-xl font-bold text-blue-800">Saldo Atual</h4>
                            <p class="text-3xl font-extrabold mt-2 text-blue-900" id="saldo-valor">Carregando...</p>
                        </div>
                    `,
                    jsContent: `
                        const saldoTotal = section.appData.transactions.reduce((acc, t) => acc + t.amount, 0);
                        const saldoElement = document.getElementById('saldo-valor');
                        if (saldoElement) {
                            saldoElement.innerText = section.utils.formatCurrency(saldoTotal);
                        }
                    `,
                    supabaseAccess: false
                });
            }

            // Seções baseadas em metas
            if (goals && goals.length > 0) {
                const firstGoal = goals[0];
                newSections.push({
                    id: "meta-financeira",
                    title: `Meta: ${firstGoal.name}`,
                    htmlContent: `
                        <div class="p-4 bg-green-100 rounded-lg shadow-inner">
                            <h4 class="text-xl font-bold text-green-800">Próxima Meta</h4>
                            <p class="text-xl font-semibold mt-2 text-green-900" id="meta-nome">${firstGoal.name}</p>
                            <p class="text-sm mt-1 text-green-700">Progresso: <span id="meta-progresso">...</span></p>
                        </div>
                    `,
                    jsContent: `
                        const meta = section.appData.goals[0];
                        const saldoTotal = section.appData.transactions.reduce((acc, t) => acc + t.amount, 0);
                        const progresso = (saldoTotal / meta.target) * 100;
                        const progressoElement = document.getElementById('meta-progresso');
                        if (progressoElement) {
                            progressoElement.innerText = \`${progresso.toFixed(2)}%\`;
                        }
                    `,
                    supabaseAccess: false
                });
            }

            // Atualizamos o estado com as novas seções
            setDashboardSections(newSections);
            setLoadingSections(false);
        }
    }, [isAuthReady, transactions, goals]); // Dependências do useEffect

    // Exibimos a mensagem de carregamento se o processo ainda não terminou.
    if (loadingSections || !isAuthReady) {
        return (
            <div className="p-4 text-center text-gray-500">
                <h1 className="text-2xl font-bold mb-4">Carregando Dashboard...</h1>
            </div>
        );
    }

    // Se não houver seções para exibir, mostramos uma mensagem.
    if (dashboardSections.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                <h1 className="text-2xl font-bold mb-4">Dashboard Personalizado</h1>
                <p>Nenhuma seção configurada para o dashboard no momento.</p>
            </div>
        );
    }
    
    // Passamos o array de seções dinâmicas para o manager.
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard Personalizado</h1>
            <HtmlJsSectionManager sections={dashboardSections} />
        </div>
    );
};

export default CustomDashboard;
