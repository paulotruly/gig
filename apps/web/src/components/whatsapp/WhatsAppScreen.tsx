'use client';

import React, { useState } from 'react';

export function WhatsAppScreen() {
  const [userMsg, setUserMsg] = useState<string | null>(null);
  const [botReply, setBotReply] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');

  const handleSend = (text: string) => {
    setUserMsg(text);
    setBotReply(false);
    setTimeout(() => {
      setBotReply(true);
    }, 600);
  };

  return (
    <section className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gig-border shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#10B981] text-white">
            Canal WhatsApp Oficial
          </span>
          <span className="text-xs text-gig-muted">Webhook nativo da API GiG</span>
        </div>
        <h2 className="text-2xl font-extrabold text-gig-dark">
          O Copiloto Financeiro no seu WhatsApp
        </h2>
        <p className="text-sm text-gig-muted mt-0.5">
          Sem precisar abrir planilhas pesadas. Você é avisado exatamente no dia da decisão.
        </p>
        <p className="mt-3 p-3 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
          Esta tela é uma demonstração com dados de exemplo. O canal real entra no ar quando a conta
          WhatsApp Business for ativada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mockup do WhatsApp */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm bg-gig-dark p-4 rounded-[40px] shadow-2xl border-4 border-slate-700">
            <div className="bg-[#ECE5DD] rounded-[32px] overflow-hidden flex flex-col h-[520px]">
              {/* Header */}
              <div className="bg-[#075E54] text-white p-3 flex items-center gap-3 shadow-md">
                <div className="w-9 h-9 rounded-full bg-gig-lime flex items-center justify-center text-black font-extrabold text-sm">
                  g
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold leading-tight flex items-center gap-1">
                    GiG Copiloto Financeiro <span className="text-[10px] text-green-300">✓</span>
                  </p>
                  <p className="text-[10px] text-emerald-100">Conta Comercial Oficial</p>
                </div>
                <span className="text-xs">⋮</span>
              </div>

              {/* Chat */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                <div className="text-center my-2">
                  <span className="bg-[#D1E8F2] text-[#2C5282] px-2.5 py-1 rounded-md text-[10px] font-medium shadow-xs">
                    Hoje
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs max-w-[85%] space-y-1.5 border border-slate-100">
                  <p className="font-bold text-gig-dark text-xs">☀️ Bom dia, Ester!</p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Passando para lembrar que seu <strong>DAS (R$ 75,90)</strong> vence nesta
                    sexta-feira.
                  </p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Seu saldo atual é de <strong>R$ 4.220,00</strong>, então esse valor já está
                    coberto com tranquilidade no seu caixa.
                  </p>
                  <div className="pt-2 flex flex-col gap-1.5">
                    <button
                      onClick={() => handleSend('Pagar DAS')}
                      className="w-full py-1.5 rounded-lg bg-gig-lime text-black font-bold text-[10px] text-center shadow-xs"
                    >
                      📱 Ver código de barras Pix
                    </button>
                    <button
                      onClick={() => handleSend('Qual minha retirada segura?')}
                      className="w-full py-1.5 rounded-lg bg-[#F3F4F6] text-slate-800 font-semibold text-[10px] text-center"
                    >
                      💵 Quanto posso retirar hoje?
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400 block text-right mt-1">09:15</span>
                </div>

                {userMsg && (
                  <div className="bg-[#E7FFDB] p-2.5 rounded-2xl rounded-tr-none shadow-xs max-w-[80%] ml-auto text-[11px] text-slate-800">
                    <span>{userMsg}</span>
                    <span className="text-[9px] text-slate-500 block text-right">09:16 ✓✓</span>
                  </div>
                )}

                {botReply && (
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs max-w-[85%] space-y-1 text-[11px]">
                    <p className="font-bold text-gig-dark">Cálculo em tempo real:</p>
                    <p className="text-slate-700">
                      Sua <strong>Retirada Segura</strong> para hoje é de até{' '}
                      <strong>R$ 1.850,00</strong>. Fazendo essa retirada para sua conta pessoal,
                      sua empresa continua com fôlego de 8.5 meses no cenário conservador.
                    </p>
                    <span className="text-[9px] text-slate-400 block text-right">09:16</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-2 bg-[#F0F2F5] flex items-center gap-2 border-t border-slate-200">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-black border border-slate-300 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (inputVal.trim()) {
                      handleSend(inputVal);
                      setInputVal('');
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center font-bold text-xs shrink-0"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gig-border shadow-card space-y-3">
            <h3 className="font-bold text-base text-gig-dark">
              Por que o WhatsApp é o canal central?
            </h3>
            <p className="text-xs text-gig-muted leading-relaxed">
              68% dos MEIs abandonam ERPs e planilhas porque exigem login e disciplina contínua. A
              GiG inverte a lógica: o sistema trabalha em segundo plano com Open Finance e só chama
              você pelo WhatsApp quando há uma decisão importante a tomar.
            </p>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gig-lime text-black font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p className="text-slate-700">
                  <strong>Alertas Preventivos:</strong> Avisa dias antes de qualquer saldo negativo
                  ou vencimento de DAS.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gig-lime text-black font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p className="text-slate-700">
                  <strong>Consultas Rápidas:</strong> Envie &quot;saldo&quot;, &quot;retirada&quot;
                  ou &quot;previsao&quot; e receba em 2 segundos.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gig-lime text-black font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p className="text-slate-700">
                  <strong>Sem Jargões:</strong> Toda linguagem é acolhedora, humana e voltada para a
                  ação prática.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
