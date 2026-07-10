'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ContactButton({ hostId, monsterId, monsterName, crownId, discordId, quest, canDeploy = false }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmingDeploy, setConfirmingDeploy] = useState(false);
  const wrapperRef = useRef(null);

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const isOwnCrown = session?.user?.id === hostId;

  const toggleMenu = () => {
    setIsOpen((current) => !current);
  };

  useEffect(() => {
    if (!isOpen && !confirmingDeploy) return;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setConfirmingDeploy(false);
      }
    }
    
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, confirmingDeploy]);

  const handleCopyTag = () => {
    navigator.clipboard.writeText(discordId || hostId);
    setStatus('copied');
    setTimeout(() => {
      setStatus('idle');
      setIsOpen(false);
    }, 1500);
  };

  const handleDeployCrown = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/crowns/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crownId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('deployed');
        setTimeout(() => {
          setStatus('idle');
          setConfirmingDeploy(false);
          router.refresh();
        }, 1200);
      } else {
        setStatus('error');
        setErrorMsg(data?.error || 'Failed to deploy crown');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const showOwnerDeployButton = isOwnCrown && canDeploy;

  const triggerClass = "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-void-raised px-4 py-2 font-display text-xs uppercase tracking-widest text-mist transition-colors hover:border-ember/40 hover:bg-ember hover:text-void disabled:cursor-not-allowed disabled:opacity-60";
  const deployTriggerClass = "inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2 font-display text-xs uppercase tracking-widest text-amber-200 transition-colors hover:border-amber-500 hover:bg-amber-500 hover:text-void disabled:cursor-not-allowed disabled:opacity-60";
  const optionClass = "flex w-full items-center gap-4 rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 text-left font-body text-mist transition-colors hover:border-ember hover:bg-ember/10";

  const menu = isOpen && typeof window !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 p-4 animate-mh-fade"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="flex w-full max-w-sm flex-col rounded-2xl border border-ember bg-void-panel shadow-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-void px-5 py-4">
          <span className="font-display text-base uppercase tracking-widest text-ember-bright">Contact Options</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-xl leading-none text-mist-dim transition-colors hover:border-white/30 hover:text-mist"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          {!isOwnCrown && (
            <>
              <a
                href={`https://discord.com/users/${hostId}`}
                target="_blank"
                className={optionClass}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                  <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={20} height={20} alt="" className="pixel-art" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-sm font-semibold">Discord Profile</span>
                  <span className="font-body text-[11px] uppercase tracking-wide text-mist-dim">Open external app</span>
                </div>
              </a>

              <button className={optionClass} onClick={handleCopyTag}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                  <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={20} height={20} alt="" className="pixel-art" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-sm font-semibold">{status === 'copied' ? 'Copied!' : 'Copy Discord ID'}</span>
                  <span className="font-body text-[11px] uppercase tracking-wide text-mist-dim">Manual add on Discord</span>
                </div>
              </button>

              <button
                className={optionClass}
                onClick={() => {
                  const url = `${window.location.origin}/monster/${encodeURIComponent(monsterName)}?crownId=${crownId}&user=${hostId}&share=${buildShareNonce()}`;
                  navigator.clipboard.writeText(url);
                  setStatus('shared');
                  setTimeout(() => {
                    setStatus('idle');
                    setIsOpen(false);
                  }, 1500);
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                  <Image src="/icons/MHWilds-Link_Party_Icon.png" width={20} height={20} alt="" className="pixel-art" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-sm font-semibold">{status === 'shared' ? 'Link Copied!' : 'Share Crown'}</span>
                  <span className="font-body text-[11px] uppercase tracking-wide text-mist-dim">Get shareable link</span>
                </div>
              </button>
            </>
          )}

          {status === 'error' && (
            <div className="mt-2 rounded-xl border border-blood bg-blood/10 p-3 text-center font-body text-xs text-red-300">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (isOwnCrown && !showOwnerDeployButton) {
    return null;
  }

  const confirmModal = confirmingDeploy && typeof window !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 p-4 animate-mh-fade" onClick={() => setConfirmingDeploy(false)}>
      <div className="flex w-full max-w-[calc(100vw-2rem)] flex-col gap-5 rounded-2xl border border-ember bg-void-panel p-6 shadow-2xl sm:min-w-[320px] sm:w-auto" onClick={e => e.stopPropagation()}>
        <div className="text-center font-display text-base uppercase tracking-wide text-mist">Spend an investigation use?</div>
        <p className="text-center font-body text-xs text-mist-dim">This will reduce the remaining uses for this crown by 1.</p>
        <div className="flex justify-center gap-3 mt-2">
          <button
            className={`${deployTriggerClass} flex-1 min-w-24 justify-center py-3 text-sm`}
            onClick={() => handleDeployCrown()}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Working...' : 'Yes'}
          </button>
          <button
            className={`${triggerClass} flex-1 min-w-24 justify-center py-3 text-sm`}
            onClick={() => setConfirmingDeploy(false)}
            disabled={status === 'loading'}
          >
            No
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (showOwnerDeployButton) {
    return (
      <>
        <div className="relative inline-block" ref={wrapperRef}>
          <button
            className={deployTriggerClass}
            onClick={() => setConfirmingDeploy(true)}
            disabled={status === 'loading'}
            title={quest === 'Investigation Quests' ? 'Spend one investigation use and mark as deployed' : 'Deploy crown'}
          >
            <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={16} height={16} alt="" className="pixel-art" />
            {status === 'deployed' ? 'Deployed!' : 'Deploy Crown'}
          </button>
          {status === 'error' && !confirmingDeploy && (
            <div className="mt-2.5 absolute right-0 w-max rounded-lg border border-blood bg-blood/10 p-2.5 text-center font-body text-xs text-red-300">
              {errorMsg}
            </div>
          )}
        </div>
        {confirmModal}
      </>
    );
  }

  return (
    <>
      <button
        className={triggerClass}
        onClick={toggleMenu}
        disabled={status === 'loading'}
      >
        <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={16} height={16} alt="" className="pixel-art" />
        {status === 'loading' ? 'Working...' : 'Contact Hunter'}
      </button>
      {menu}
    </>
  );
}
