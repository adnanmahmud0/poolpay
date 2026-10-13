import Image from "next/image";

import { ArrowUpRight, LayoutGrid, Smartphone, UsersRound } from "lucide-react";

import { APP_DOWNLOAD } from "@/config/app-download";

function StoreLinks() {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {APP_DOWNLOAD.appStoreUrl && (
          <a
            href={APP_DOWNLOAD.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download PoolPay on the App Store (opens in a new tab)"
            className="rounded-lg p-3"
          >
            <Image
              src="/images/poolpay/app-store.svg"
              width={156}
              height={52}
              alt="Download on the App Store"
            />
          </a>
        )}
        <a
          href={APP_DOWNLOAD.googlePlayUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get PoolPay on Google Play (opens in a new tab)"
          className="-ml-3 rounded-lg"
        >
          <Image
            src="/images/poolpay/google-play.png"
            width={202}
            height={78}
            alt="Get it on Google Play"
          />
        </a>
        {!APP_DOWNLOAD.appStoreUrl && (
          <div className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-300/80 px-4 py-3 text-slate-500">
            <Smartphone className="size-5" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <span className="block font-medium text-slate-600">Coming soon</span>
              <span>on iPhone</span>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Available on Android.{" "}
        {APP_DOWNLOAD.appStoreUrl ? "Now on iPhone, too." : "iOS is on the way."}
      </p>
    </div>
  );
}

function AppPreview() {
  return (
    <figure
      className="relative mx-auto flex w-full max-w-[500px] flex-col items-center justify-center py-10 lg:py-12"
      data-reveal
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-[32px] bg-[radial-gradient(ellipse_at_center,#d0e6f3_0%,#e9f2f8_55%,transparent_75%)]"
      >
        <div className="absolute top-1/2 left-1/2 size-[330px] -translate-1/2 rounded-full border border-white/80 sm:size-[400px]" />
        <div className="absolute top-1/2 left-1/2 size-[240px] -translate-1/2 rounded-full border border-white/80 sm:size-[310px]" />
      </div>
      <div className="relative w-[226px] rotate-3 rounded-[30px] border border-slate-500 bg-[#152231] p-[7px] shadow-[18px_30px_65px_-20px_#24445e70] motion-safe:transition-transform motion-safe:duration-700 motion-safe:hover:rotate-0 sm:w-[248px]">
        <Image
          src="/images/poolpay/groups.webp"
          width={664}
          height={1440}
          alt="PoolPay My Groups screen with create and join group options, group status and member details"
          sizes="(min-width: 640px) 234px, 212px"
          className="h-auto w-full rounded-[23px]"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute top-24 left-0 flex items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-[0_12px_40px_-15px_#24445e50] max-[380px]:left-[-8px] sm:left-3 lg:left-0 xl:left-3"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#e9f2f8] text-[#377db1]">
          <UsersRound className="size-5" />
        </span>
        <div>
          <p className="text-[9px] font-semibold tracking-[0.12em] text-slate-500">
            CREATE & CONNECT
          </p>
          <p className="mt-1 text-xs font-semibold">Your circle starts here.</p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute right-0 bottom-28 flex items-center gap-2.5 rounded-full border border-white bg-white px-4 py-3 shadow-[0_12px_40px_-15px_#24445e50] sm:right-3"
      >
        <span className="size-1.5 rounded-full bg-emerald-600" />
        <span className="text-[10px] font-medium tracking-wide text-slate-600">
          Ready for your next group
        </span>
        <ArrowUpRight className="size-3.5 text-[#377db1]" />
      </div>
      <figcaption className="relative mt-8 text-[10px] tracking-[0.08em] text-slate-500">
        A LOOK INSIDE POOLPAY · ACTUAL APP SCREEN
      </figcaption>
    </figure>
  );
}

export function AppDownload() {
  return (
    <section id="download" aria-labelledby="download-heading" className="pt-20 lg:pt-24">
      <div className="section-shell">
        <div className="relative grid items-center gap-3 overflow-hidden rounded-[32px] border border-[#dce7ed] bg-[#edf4f7] px-6 py-8 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-14 lg:py-6">
          <div className="relative z-10 py-4 lg:py-10">
            <div data-reveal>
              <p className="eyebrow section-eyebrow">
                <span /> A LITTLE MORE CONNECTED
              </p>
              <figure className="mb-7 flex items-center gap-3">
                <Image
                  src="/images/poolpay/logo.png"
                  width={295}
                  height={285}
                  alt="PoolPay logo"
                  className="h-auto w-16 rounded-2xl"
                />
                <figcaption>
                  <span className="font-heading block text-xl font-semibold tracking-tight">
                    PoolPay
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Your people. Your possibilities.
                  </span>
                </figcaption>
              </figure>
              <h2 id="download-heading">
                Your groups.
                <br />
                Wherever <span className="text-blue-600">you go.</span>
              </h2>
              <p className="mt-6 max-w-[400px] text-sm leading-7 text-slate-600">
                Bring your circle together with PoolPay. Create or join a group, see its status, and
                keep the details close — all from your phone.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <UsersRound className="size-4 text-[#377db1]" aria-hidden="true" /> Create & join
                  groups
                </span>
                <span className="flex items-center gap-2">
                  <LayoutGrid className="size-4 text-[#377db1]" aria-hidden="true" /> See your group
                  status
                </span>
              </div>
            </div>
            <StoreLinks />
          </div>
          <AppPreview />
        </div>
      </div>
    </section>
  );
}
