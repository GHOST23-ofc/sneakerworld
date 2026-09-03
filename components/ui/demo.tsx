"use client";

import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";

export function DotPatternDemo() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white md:shadow-xl">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-extrabold tracking-tighter text-slate-900">
        SNEAKER WORLD <span className="text-[#e6192e]">MLS</span>
      </p>
      <p className="z-10 mt-2 text-sm font-semibold tracking-wide text-slate-500">
        Bolsa de Calzado Mayorista & Vitrinas Cali • Modo Claro
      </p>
      <DotPattern
        width={20}
        height={20}
        cx={2}
        cy={2}
        cr={1.2}
        className={cn(
          "fill-slate-400/50 [mask-image:radial-gradient(350px_circle_at_center,white,transparent)]",
        )}
      />
    </div>
  );
}
