import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/bsky";

/** Avatar + handle + DID for a repo, resolved from the Bluesky AppView. */
export function DidIdentity({ did, profile }: { did: string; profile?: Profile }) {
  const name = profile?.handle ? `@${profile.handle}` : "unresolved";
  const initials = (profile?.handle ?? did.replace(/^did:\w+:/, "")).slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        {profile?.avatar && <AvatarImage src={profile.avatar} alt={name} />}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="text-muted-foreground truncate font-mono text-xs">{did}</div>
      </div>
    </div>
  );
}

const linkCls =
  "text-muted-foreground hover:text-foreground hover:bg-accent inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors";

/**
 * Out-links to the repo's Bluesky profile and its records on pdsls. When
 * `recordUri` is given, also links straight to that specific record on pdsls.
 */
export function DidLinks({ did, handle, recordUri }: { did: string; handle?: string; recordUri?: string }) {
  return (
    <div className="flex items-center gap-1">
      <a href={`https://bsky.app/profile/${handle ?? did}`} target="_blank" rel="noreferrer" className={linkCls}>
        Bluesky <ExternalLink className="size-3" />
      </a>
      <a href={`https://pdsls.dev/at://${did}`} target="_blank" rel="noreferrer" className={linkCls}>
        Repo <ExternalLink className="size-3" />
      </a>
      {recordUri && (
        <a href={`https://pdsls.dev/${recordUri}`} target="_blank" rel="noreferrer" className={linkCls}>
          Record <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
