import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function LandingPage() {
  return (
    <div className="ml" dir="rtl" lang="fa">
      <header className="ml__nav">
        <Link href="/" className="ml__logo" aria-label="Mindora">
          <BrandLogo size={34} />
          <span>Mindora</span>
        </Link>
        <Link href="/login" className="ml__nav-btn">
          ورود
        </Link>
      </header>

      {/* Calm-style photographic cover */}
      <section className="ml__hero">
        <div
          className="ml__hero-bg"
          style={{ backgroundImage: "url(/landing-hero.png)" }}
        />
        <div className="ml__hero-shade" />
        <div className="ml__hero-content">
          <p className="ml__wordmark ml__fade ml__fade--1">Mindora</p>
          <h1 className="ml__headline ml__fade ml__fade--2">
            فکر کن.
            <br />
            برنامه بریز.
            <br />
            رشد کن.
          </h1>
          <p className="ml__sub ml__fade ml__fade--3">
            سیستم شخصی زندگی — برای یک نفر، نه یک تیم.
          </p>
          <Link
            href="/login"
            className="ml__btn ml__btn--light ml__fade ml__fade--4"
          >
            ورود به مایندورا
          </Link>
        </div>
      </section>

      {/* Arc-style: product is the proof */}
      <section className="ml__proof" id="product">
        <div className="ml__proof-copy">
          <p className="ml__eyebrow">امروز</p>
          <h2>هر صبح از اینجا شروع می‌شود</h2>
          <p>
            تمرکز روز، هفتهٔ جلالی و کارهای باز — در یک نگاه آرام، فقط برای تو.
          </p>
        </div>
        <div className="ml__proof-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing-shot-today.png"
            alt="داشبورد امروز مایندورا"
            width={1600}
            height={900}
            decoding="async"
          />
        </div>
      </section>

      {/* Zigzag features — product photography */}
      <section className="ml__features">
        <article className="ml__feat">
          <div className="ml__feat-text">
            <p className="ml__eyebrow">بورد</p>
            <h2>کار را ببین، نه فقط لیست کن</h2>
            <p>
              ستون‌ها، اولویت و جریان کار — بدون سروصدای تیمی و منشن‌های بی‌پایان.
            </p>
          </div>
          <div className="ml__feat-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing-shot-board.png"
              alt="بورد کانبان مایندورا"
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
            />
          </div>
        </article>

        <article className="ml__feat ml__feat--flip">
          <div className="ml__feat-text">
            <p className="ml__eyebrow">زبان</p>
            <h2>یادگیری که کنار زندگی می‌نشیند</h2>
            <p>
              واژگان و شنیدار در همان فضایی که پژوهش و کار روزانه‌ات هست — نه یک
              اپ جدا.
            </p>
          </div>
          <div className="ml__feat-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing-shot-lang.png"
              alt="یادگیری زبان در مایندورا"
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
            />
          </div>
        </article>
      </section>

      {/* Short space strip — typographic, not cards */}
      <section className="ml__strip" aria-label="فضاها">
        <p>
          <strong>دکتری</strong>
          <span>پژوهش و نوشتن</span>
        </p>
        <p>
          <strong>کار</strong>
          <span>بورد و ساعت</span>
        </p>
        <p>
          <strong>زبان</strong>
          <span>واژه و شنیدار</span>
        </p>
        <p>
          <strong>زندگی</strong>
          <span>عادت و روزمرگی</span>
        </p>
      </section>

      <section className="ml__close">
        <p className="ml__close-brand">Mindora</p>
        <p className="ml__close-line">ذهنت را جمع کن. روزت را هم.</p>
        <Link href="/login" className="ml__btn ml__btn--dark">
          ورود به مایندورا
        </Link>
      </section>

      <footer className="ml__foot">
        <p>
          ساخته‌شده توسط{" "}
          <a
            href="https://mrmaper.ir"
            target="_blank"
            rel="noopener noreferrer"
          >
            MrMaper
          </a>
        </p>
        <p className="ml__foot-meta">mindoraos.ir</p>
      </footer>
    </div>
  );
}
