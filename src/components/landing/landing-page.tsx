import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function LandingPage() {
  return (
    <div className="landing" dir="rtl" lang="fa">
      <header className="landing__top">
        <Link href="/" className="landing__brand-lockup" aria-label="Mindora">
          <BrandLogo size={36} className="landing__logo" />
          <span className="landing__brand-name">Mindora</span>
        </Link>
        <Link href="/login" className="landing__nav-link">
          ورود
        </Link>
      </header>

      <section className="landing__hero" aria-label="معرفی">
        <div
          className="landing__hero-media"
          style={{ backgroundImage: "url(/landing-hero.jpg)" }}
          role="img"
          aria-label="میز کار آرام در نور صبح"
        />
        <div className="landing__hero-veil" />

        <div className="landing__hero-copy">
          <p className="landing__wordmark landing__anim landing__anim--1">
            Mindora
          </p>
          <h1 className="landing__headline landing__anim landing__anim--2">
            فکر کن. برنامه بریز. رشد کن.
          </h1>
          <p className="landing__lede landing__anim landing__anim--3">
            سیستم شخصی برای کار، پژوهش، زبان و روزمرگی — با تقویم شمسی.
          </p>
          <div className="landing__cta landing__anim landing__anim--4">
            <Link href="/login" className="landing__btn landing__btn--primary">
              ورود به Mindora
            </Link>
            <a href="#spaces" className="landing__btn landing__btn--ghost">
              فضاها را ببین
            </a>
          </div>
        </div>
      </section>

      <section id="spaces" className="landing__section">
        <h2 className="landing__section-title">یک سیستم. چند فضای زندگی.</h2>
        <p className="landing__section-lede">
          هر حوزه جای خودش را دارد — بدون سروصدای تیمی.
        </p>
        <ul className="landing__spaces">
          <li>
            <span className="landing__space-name">دکتری</span>
            <span className="landing__space-desc">
              پایپ‌لاین پژوهش، منابع و نوشتن
            </span>
          </li>
          <li>
            <span className="landing__space-name">کار</span>
            <span className="landing__space-desc">
              تسک، بورد و ثبت ساعت
            </span>
          </li>
          <li>
            <span className="landing__space-name">زبان</span>
            <span className="landing__space-desc">
              واژگان، شنیدار و آمادگی آزمون
            </span>
          </li>
          <li>
            <span className="landing__space-name">زندگی</span>
            <span className="landing__space-desc">
              عادت‌ها، خانه و امور روز
            </span>
          </li>
        </ul>
      </section>

      <section className="landing__section landing__section--tight">
        <h2 className="landing__section-title">از امروز تا هفته، در یک نگاه</h2>
        <p className="landing__section-lede">
          داشبورد امروز، تقویم جلالی، و بازبینی هفتگی — تا بدانی چه مانده و چه
          جلو می‌رود.
        </p>
      </section>

      <section className="landing__close">
        <p className="landing__close-brand">Mindora</p>
        <p className="landing__close-line">فضای شخصی‌ات را روشن کن.</p>
        <Link href="/login" className="landing__btn landing__btn--primary">
          شروع کن
        </Link>
      </section>

      <footer className="landing__foot">
        <span>Think. Plan. Grow</span>
        <span className="landing__foot-sep" aria-hidden>
          ·
        </span>
        <span>mindoraos.ir</span>
      </footer>
    </div>
  );
}
