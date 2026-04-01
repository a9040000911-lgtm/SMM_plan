"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

export function YandexMetrica() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (YM_COUNTER_ID) {
      const url = `${pathname}?${searchParams.toString()}`;
      // @ts-expect-error: Yandex Metrica global variable isn't typed
      ym(YM_COUNTER_ID, "hit", url);
    }
  }, [pathname, searchParams]);

  if (!YM_COUNTER_ID) return null;

  return (
    <Script id="yandex-metrica" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${YM_COUNTER_ID}, "init", {
             clickmap:true,
             trackLinks:true,
             accurateTrackBounce:true,
             webvisor:true
        });
      `}
    </Script>
  );
}
