import { SignInButton } from "@/features/auth";
import { Emblem } from "@/shared/ui";

export function SignedOutCard({ className }: { className: string }) {
  return (
    <section className={`wd hm-out ${className}`}>
      <div>
        <span className="eyebrow">Your Guild Card</span>
        <h3>Sign in to start</h3>
        <p>Log crowns, collect monsters and climb from Fledgling to Legend.</p>
      </div>
      <div className="hm-ranks" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className={index === 0 ? "on" : ""}>
            <Emblem rank={index + 1} />
          </div>
        ))}
      </div>
      <div className="hm-outacts">
        <SignInButton className="btn sm" />
        <a
          className="hm-ln"
          href="https://discord.gg/mhwilds"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join Discord
        </a>
      </div>
    </section>
  );
}
