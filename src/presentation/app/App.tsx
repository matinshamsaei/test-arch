import { useState } from "react";

import { primaryButtonClass, secondaryButtonClass } from "../shared/styles.ts";
import { workspaces } from "./features.ts";
import type { WorkspaceId } from "./features.ts";

export default function App() {
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId>("scheduling");
  const workspace = workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return null;
  const Page = workspace.Page;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <nav className="mx-auto flex w-full max-w-2xl gap-2 px-4 pt-6">
        {workspaces.map((item) => {
          const selected = item.id === workspace.id;

          return (
            <button
              key={item.id}
              type="button"
              className={selected ? primaryButtonClass : secondaryButtonClass}
              aria-pressed={selected}
              onClick={() => setWorkspaceId(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <Page />
    </div>
  );
}
