import type { AppModule } from "@/lib/modules";

export type GuideBlock =
  | { type: "steps"; title: string; items: string[] }
  | { type: "details"; title: string; items: { name: string; body: string }[] }
  | { type: "tip"; body: string }
  | { type: "links"; items: { href: string; label: string }[] };

export type GuideSection = {
  id: string;
  group: string;
  title: string;
  summary: string;
  href?: string;
  /** Member module required to open the page. */
  module?: AppModule;
  /** Only the admin account can open this page. */
  adminOnly?: boolean;
  blocks: GuideBlock[];
};

export type GuideCopy = {
  kicker: string;
  title: string;
  intro: string;
  searchPlaceholder: string;
  searchEmpty: string;
  open: string;
  off: string;
  adminBanner: string;
  adminBadge: string;
  tocLabel: string;
  backToTop: string;
  startTitle: string;
  starts: { id: string; title: string; text: string }[];
  sections: GuideSection[];
};

const fa: GuideCopy = {
  kicker: "آموزش",
  title: "راهنمای مایندورا",
  intro:
    "مایندورا فضای شخصی یک نفر است: کار، پژوهش، زبان و زندگی‌ات کنار هم، بدون دیدن کار بقیه. این راهنما هر بخش را همان‌طور که در سامانه هست توضیح می‌دهد؛ از صفحهٔ صبح تا خروجی اکسل آخر هفته.",
  searchPlaceholder: "جستجو در راهنما… مثلاً واژگان، بورد، ساعت",
  searchEmpty: "چیزی با این عبارت پیدا نشد. یک کلمهٔ کوتاه‌تر امتحان کن.",
  open: "باز کردن این بخش",
  off: "این بخش روی حساب تو روشن نیست.",
  adminBanner:
    "این راهنما فضای عضو را هم توضیح می‌دهد. از این حساب فقط «کاربرها» باز می‌شود؛ تب‌های شخصی مال اعضای ساخته‌شده است.",
  adminBadge: "فقط مدیر",
  tocLabel: "فهرست راهنما",
  backToTop: "بالای صفحه",
  startTitle: "یک روز معمولی",
  starts: [
    {
      id: "today",
      title: "صبح، از امروز",
      text: "سررسیدها، سه اولویت، و عادت‌ها را همان اول ببین.",
    },
    {
      id: "board",
      title: "وسط روز، روی بورد",
      text: "کارت را بین ستون‌ها بکش تا وضعیت کار جلو برود.",
    },
    {
      id: "review",
      title: "آخر هفته، بازبینی",
      text: "آنچه تمام شد و آنچه ماند را جمع کن و هفتهٔ بعد را بچین.",
    },
  ],
  sections: [
    {
      id: "space",
      group: "شروع",
      title: "فضای شخصی",
      summary:
        "هر عضو یک فضای جدا دارد. کارها، نوشته‌ها، واژگان و ساعت‌های تو فقط برای خودت است و نام بقیهٔ اعضا در فیلترها نمی‌آید.",
      blocks: [
        {
          type: "details",
          title: "چهار حوزه",
          items: [
            {
              name: "دکتری",
              body: "پژوهش، فصل، مقاله و منبع. خط لولهٔ پژوهش هم روی همین حوزه سوار است.",
            },
            {
              name: "کار",
              body: "شغل و مسیرهایی که به کار روزمره وصل‌اند.",
            },
            {
              name: "زندگی",
              body: "کارهای شخصی بیرون از درس و شغل.",
            },
            {
              name: "زبان",
              body: "جلسه، واژه، شنیداری و آزمون. هاب زبان همین حوزه را عمیق‌تر می‌کند.",
            },
          ],
        },
        {
          type: "details",
          title: "حوزه و مسیر",
          items: [
            {
              name: "حوزه",
              body: "چهار تا هستند و اضافه نمی‌شوند: دکتری، کار، زندگی، زبان.",
            },
            {
              name: "مسیر",
              body: "نامی است که زیر یک حوزه می‌سازی. در پژوهش همان مسیرهای دکتری است و در زبان همان مسیرهای زبان. همه‌جا به آن مسیر می‌گوییم.",
            },
          ],
        },
        {
          type: "tip",
          body: "اگر تبی را در منو نمی‌بینی، ماژولش برای حساب تو خاموش است. تقویم، بورد و بازبینی هفته با روشن بودن «کارها» می‌آیند. پژوهش بدون «نوشته‌ها» روشن نمی‌شود.",
        },
      ],
    },
    {
      id: "today",
      group: "روزانه",
      title: "امروز",
      summary:
        "صفحهٔ شروع هر روز. سررسید امروز، کار عقب‌افتاده، اینباکس، بار هفته، سه اولویت، عادت و جلسهٔ تمرکز اینجاست.",
      href: "/dashboard",
      module: "dashboard",
      blocks: [
        {
          type: "steps",
          title: "صبح را این‌طور باز کن",
          items: [
            "از منو وارد «امروز» شو.",
            "اگر بنر کارهای ناتمام دیروز آمد، «همه را به امروز بیاور» را بزن تا عقب نمانند.",
            "سه اولویت همیشه سه جایگاه است. کار عقب‌افتاده، کار امروز، یا کار بدون زمان را می‌توانی انتخاب کنی؛ کار فردا و بقیهٔ هفته داخل فهرست نمی‌آید. با تمام‌شدن هر کدام، شمارنده مثل ۲/۳ ✓ می‌شود.",
            "عادت‌ها را تیک بزن. نوار فعالیت و streak همان‌جا به‌روز می‌شود.",
            "در «تمرکز امروز» یک کار را انتخاب کن و جلسه را شروع کن. ۱۵، ۲۵ یا ۵۰ دقیقه. با تمام شدن یا «ثبت و توقف»، همان دقیقه در ساعت‌ها و گزارش می‌نشیند. استراحت ثبت نمی‌شود.",
          ],
        },
        {
          type: "details",
          title: "قطعه‌های صفحه",
          items: [
            {
              name: "تمرکز امروز",
              body: "یک جلسهٔ واقعی: کار را انتخاب کن، ۱۵ یا ۲۵ یا ۵۰ دقیقه تمرکز کن، بعد استراحت. زمان تمرکز روی همان کار در ساعت‌ها و گزارش ذخیره می‌شود.",
            },
            {
              name: "توجه امروز",
              body: "فقط وقتی چیزی برای توجه باشد می‌آید: کار عقب‌افتاده، واژهٔ آمادهٔ مرور، منبع نخوانده، یا دقیقهٔ مانده تا هدف زبان. اگر هیچ‌کدام نباشد، می‌نویسد همه‌چیز مرتب است.",
            },
            {
              name: "لیست‌ها",
              body: "فهرست «امروز» سررسید همین روز است. کنارش سه زبانه است: اینباکس، عقب‌افتاده، و این هفته. از همین‌جا می‌توانی کاری را تمام کنی یا به این هفته بفرستی.",
            },
            {
              name: "نوار هفته",
              body: "بار روزهای پیش رو را یک‌جا نشان می‌دهد تا امروز را جدا از کل هفته ببینی.",
            },
            {
              name: "حوزه‌ها",
              body: "میانبر به دکتری، کار، زندگی و زبان.",
            },
            {
              name: "عادت‌ها",
              body: "عادت جدید با یک نام ساخته می‌شود. تیک امروز، لغو امروز، بایگانی، و نقشهٔ فعالیت. اگر این کارت نیست، ماژول عادت خاموش است.",
            },
            {
              name: "ثبت سریع با N",
              body: "جمله با قاعده خوانده می‌شود، نه با مدل. پیش‌فرض کار است. «ایده:» یادداشت می‌سازد و «عادت:» عادت. امروز، فردا، امشب، «دو روز دیگر»، «هفته بعد»، نام روز و «تا جمعه» تاریخ‌اند. ساعت را با «ساعت ۱۰» یا با صبح، ظهر، عصر و شب بگو. مقاله و پژوهش حوزهٔ دکتری است و در فهرست امروز نمی‌آید؛ در همهٔ کارها و بورد ذخیره شده است. کلمهٔ «کار» حوزه را عوض نمی‌کند.",
            },
          ],
        },
        {
          type: "tip",
          body: "کلید N، بیرون از فیلدها، ثبت سریع را باز می‌کند. Ctrl+K جستجو می‌ماند. داخل همان پنجره «چطور جمله را می‌خواند؟» را باز کن؛ برچسب‌ها قبل از ثبت، همان چیزی است که ذخیره می‌شود.",
        },
      ],
    },
    {
      id: "board",
      group: "روزانه",
      title: "بورد",
      summary:
        "همان کارها، به شکل ستون. کارت را بکش تا وضعیت عوض شود. ستون‌ها: اینباکس، این هفته، در حال انجام، بازخورد، تست، تمام، و منتظر.",
      href: "/kanban",
      module: "kanban",
      blocks: [
        {
          type: "steps",
          title: "کار را روی بورد جلو ببر",
          items: [
            "کارت را با کشیدن به ستون بعدی ببر. روی گوشی اگر کشیدن سخت بود، کارت را باز کن و وضعیت را از داخل فرم عوض کن.",
            "برای کار تازه، ساخت کارت را بزن. عنوان کافی است؛ حوزه، مسیر، سررسید، اولویت و برچسب را همان‌جا یا بعداً پر کن.",
            "جستجو عنوان کارت را محدود می‌کند. فیلتر حوزه، مسیر، اولویت و برچسب هم کنارش است.",
            "کارت را باز کن تا توضیح، دیدگاه، پیوست، فعالیت و ساعت‌های ثبت‌شده را ببینی.",
          ],
        },
        {
          type: "details",
          title: "معنی ستون‌ها",
          items: [
            { name: "اینباکس", body: "هنوز برای این هفته چیده نشده. جای ایده‌های خام." },
            { name: "این هفته", body: "قبول کرده‌ای در همین هفته انجام شود." },
            { name: "در حال انجام", body: "الان رویش کار می‌کنی." },
            { name: "بازخورد", body: "منتظر نظر؛ مثلاً استاد یا خودت در یک دور بازخوانی." },
            { name: "تست", body: "کار تقریباً تمام است و باید یک بار چک شود." },
            { name: "تمام", body: "بسته شده. از لیست‌های باز امروز خارج می‌شود." },
            { name: "منتظر", body: "گیر کرده و به چیز دیگری وابسته است." },
          ],
        },
        {
          type: "tip",
          body: "بورد مال خود توست. کارت را به کس دیگری واگذار نمی‌کنی و فیلتر افراد برای عضو نشان داده نمی‌شود.",
        },
      ],
    },
    {
      id: "tasks",
      group: "روزانه",
      title: "همه کارها",
      summary:
        "جدول کامل کارها با جستجو، فیلتر و مرتب‌سازی. هر جا کار ساختی، اینجا هم هست.",
      href: "/tasks",
      module: "tasks",
      blocks: [
        {
          type: "steps",
          title: "یک کار دقیق بساز",
          items: [
            "«ایجاد کار» را بزن.",
            "عنوان را بنویس. توضیح را وقتی لازم شد اضافه کن.",
            "وضعیت، اولویت (فوری، بالا، متوسط، پایین، هیچ) و نوع (کار، استوری، باگ، اپیک) را انتخاب کن.",
            "حوزه را مشخص کن و اگر مسیر ساخته‌ای، کار را به همان مسیر وصل کن.",
            "سررسید را از تقویم انتخاب کن. تکرار می‌تواند هر روز، هر هفته یا هر ماه باشد.",
            "برچسب رنگی بساز یا از برچسب‌های قبلی انتخاب کن.",
            "ذخیره کن. بعداً از همان ردیف، کار را ویرایش یا حذف می‌کنی.",
          ],
        },
        {
          type: "details",
          title: "داخل کارت کار",
          items: [
            {
              name: "دیدگاه",
              body: "یادداشت بگذار. منشن با @ فقط به کسانی که روی همان کار هستند اشاره می‌کند؛ در فضای شخصی یعنی خودت.",
            },
            {
              name: "پیوست و فعالیت",
              body: "فایل وصل می‌شود. تاریخچه می‌گوید وضعیت، اولویت، سررسید، برچسب یا توضیح کی عوض شده.",
            },
            {
              name: "ساعت",
              body: "از داخل کار، «ثبت ساعت» را بزن: مدت، تاریخ، و شرح اختیاری. جمع این ثبت‌ها در «ساعت‌ها» و «گزارش‌گیری» می‌آید.",
            },
            {
              name: "تکرار",
              body: "می‌توانی نوبت بعدی را رد کنی، تکرار را روی کل سری اعمال کنی، برایش پایان بگذاری، یا سری را متوقف کنی.",
            },
            {
              name: "فیلتر جدول",
              body: "جستجوی عنوان، وضعیت، اولویت، حوزه و مسیر. اگر برچسب داشته باشی، آن هم هست. سرستون‌های عنوان، مسیر، وضعیت، اولویت، فرد و موعد مرتب می‌شوند. جدول را می‌توانی بر اساس مسیر، تاریخ، وضعیت یا حوزه گروه کنی و هر گروه را با کلیک جمع کنی. اگر هنوز کاری نباشد، صفحه از تو می‌خواهد اولین کار را بسازی. روی موبایل هر ردیف یک کارت است؛ منوی همان کارت ویرایش و حذف را دارد.",
            },
          ],
        },
      ],
    },
    {
      id: "calendar",
      group: "روزانه",
      title: "تقویم",
      summary:
        "سررسید کارها روی تقویم شمسی. نمای ماه برای تصویر کلی، نمای هفته برای چند روز نزدیک.",
      href: "/calendar",
      module: "calendar",
      blocks: [
        {
          type: "steps",
          title: "روز را از روی تقویم بچین",
          items: [
            "ماه یا هفته را انتخاب کن و با فلش‌ها جلو و عقب برو. «امروز» برمی‌گرداند به روز جاری.",
            "فیلتر حوزه را بگذار روی همه، یا فقط دکتری، کار، زندگی، زبان.",
            "روی یک روز بزن. کارهایی که سررسیدشان همان روز است فهرست می‌شوند.",
            "از «کار برای این روز» یک کار با همان سررسید بساز.",
          ],
        },
        {
          type: "tip",
          body: "کاری که سررسید ندارد روی تقویم دیده نمی‌شود. اگر می‌خواهی در یک روز مشخص باشد، موقع ساخت یا ویرایش تاریخ بده.",
        },
      ],
    },
    {
      id: "areas",
      group: "فضاها",
      title: "حوزه‌ها و مسیرها",
      summary:
        "خانهٔ چهار حوزه. هر حوزه یک سطل ثابت شخصی است. داخلش مسیر می‌سازی تا کارها پراکنده نمانند.",
      href: "/projects",
      module: "projects",
      blocks: [
        {
          type: "steps",
          title: "مسیر بساز و کار را به آن وصل کن",
          items: [
            "وارد «حوزه‌ها و مسیرها» شو و یکی از چهار حوزه را باز کن.",
            "یک مسیر با نام بساز؛ مثلاً «داوری مقاله» زیر کار، یا «فصل روش» زیر دکتری.",
            "داخل مسیر، کار جدید بساز یا از فهرست کارهای همان مسیر وضعیت‌شان را ببین: کل، باز، تمام، عقب‌افتاده، درصد پیشرفت.",
            "از مسیر می‌توانی به بورد یا جدول همهٔ کارها بپری.",
          ],
        },
        {
          type: "tip",
          body: "دعوت عضو به مسیر خاموش است. این سطل‌ها شخصی‌اند و با حساب دیگران مشترک نمی‌شوند.",
        },
      ],
    },
    {
      id: "docs",
      group: "فضاها",
      title: "نوشته‌ها",
      summary:
        "ویرایشگر سند برای یادداشت روزانه، فصل، و هر متن بلندی که باید بماند. ذخیره خودکار است.",
      href: "/docs",
      module: "docs",
      blocks: [
        {
          type: "steps",
          title: "یک سند را از صفر تا خروجی ببر",
          items: [
            "«سند جدید» یا «از قالب» را بزن. قالب‌ها شامل ایده، فصل، یادداشت منبع و مرور ادبیات‌اند.",
            "عنوان بگذار و در متن بنویس. با / دستور می‌آوری: عنوان، فهرست، چک‌لیست، نقل‌قول، کد، لینک، جدول، تصویر، پاورقی.",
            "نوار ابزار همان کارها را با دکمه انجام می‌دهد: پررنگ، کج، خط‌خورده، H1 تا H3.",
            "پوشه و تگ بده تا بعداً بین سندها گم نشوی. حوزه را هم اگر لازم است مشخص کن.",
            "وضعیت سند را بین ایده، در حال نوشتن، بازبینی و آماده عوض کن.",
            "وقتی متن مهم شد «ذخیره نسخه» را بزن. نسخهٔ خودکار هم قبل از ویرایش مهم نگه داشته می‌شود. دو نسخه را می‌توانی کنار هم مقایسه کنی و قبلی را برگردانی.",
            "خروجی را Markdown، Word، یا چاپ / PDF بگیر.",
          ],
        },
        {
          type: "details",
          title: "پنل کنار سند",
          items: [
            {
              name: "سرفصل",
              body: "از H1 و H2 و H3 ساخته می‌شود و با کلیک به همان جای متن می‌پرد.",
            },
            {
              name: "کارها",
              body: "سند را به کار موجود وصل کن، یا از عنوان سند کار بساز. متن انتخاب‌شده را هم می‌توانی مستقیم به کار تبدیل کنی. چک‌لیست سند را پیش‌نمایش می‌کنی و هر مورد را که خواستی به کار جدا تبدیل می‌کنی.",
            },
            {
              name: "منابع و نقل‌قول",
              body: "منبع با عنوان، نویسنده، سال، لینک و یادداشت. PDF را پیوست کن، متنش را انتخاب کن و نقل‌قول بساز، بعد همان نقل‌قول را داخل سند درج کن.",
            },
            {
              name: "هدف کلمه و نبض نوشتن",
              body: "برای سند سقف کلمه بگذار. اگر سندی مدت‌ها ساکت مانده باشد، نبض نوشتن یادآوری می‌کند.",
            },
            {
              name: "حالت تمرکز",
              body: "اطراف ویرایشگر را خلوت می‌کند تا فقط متن بماند.",
            },
            {
              name: "یادداشت امروز",
              body: "هر روز یک سند روزانه باز می‌شود؛ از نوشته‌ها یا از پنل پژوهش.",
            },
            {
              name: "آرشیو و سطل",
              body: "سند را آرشیو کن یا به سطل بفرست. حذف‌شده‌ها تا ۳۰ روز قابل برگشت‌اند؛ حذف دائمی جداگانه است.",
            },
          ],
        },
      ],
    },
    {
      id: "research",
      group: "فضاها",
      title: "پژوهش",
      summary:
        "هاب دکتری با سه زبانه: خط لولهٔ کارها، کتابخانهٔ منابع، و میز نوشتن. حوزهٔ همه‌شان دکتری است.",
      href: "/research",
      module: "research",
      blocks: [
        {
          type: "steps",
          title: "یک خط پژوهش را راه بینداز",
          items: [
            "اگر چند مقاله داری، بالای صفحه «مسیر جدید» بساز و نام بگذار. «همه» همه‌چیز را نشان می‌دهد و «صندوق» مال کارها و سندهای بدون مسیر است.",
            "در زبانهٔ خط لوله، کارت را بین ایده، مطالعه، نوشتن، بازخورد، و تمام / سابمیت جابه‌جا کن.",
            "از کنار خط لوله، یادداشت امروز یا یک قالب (ایده، فصل، منبع، مرور ادبیات) را باز کن تا مستقیم در نوشته‌ها ساخته شود.",
            "در کتابخانه منبع اضافه کن. اگر DOI داری، واکشی فیلدها را از روی آن پر می‌کند. وضعیت مطالعه را بگذار: برای مطالعه، در حال مطالعه، خوانده‌شده.",
            "PDF را به منبع بچسبان، استناد را کپی کن، یا BibTeX کل کتابخانه را خروجی بگیر.",
            "در زبانهٔ نوشتن، پوشه‌های پیش‌فرض دکتری را بساز و سندهای ساکت را از نبض نوشتن پیدا کن.",
          ],
        },
        {
          type: "tip",
          body: "خط لوله همان کارها را با برچسب وضعیت پژوهش نشان می‌دهد، نه یک فهرست جدا. تمام‌کردن کارت اینجا یعنی کار دکتری به ستون آخر رسیده است.",
        },
      ],
    },
    {
      id: "language",
      group: "فضاها",
      title: "زبان",
      summary:
        "هاب تمرین زبان با شش زبانه: امروز، مهارت‌ها، واژگان، شنیداری، آزمون‌ها، یادداشت‌ها.",
      href: "/language",
      module: "language",
      blocks: [
        {
          type: "details",
          title: "هر زبانه چه کار می‌کند",
          items: [
            {
              name: "امروز",
              body: "یک جلسه را با دقیقه و یادداشت اختیاری ثبت کن. هدف هفته، دقیقهٔ جمع‌شده، روزهای پیاپی، و جلسات اخیر را همین‌جا می‌بینی. مسیر زبان (مثلاً یک آزمون خاص) را از بالا جدا کن.",
            },
            {
              name: "مهارت‌ها",
              body: "گرامر، خواندن، نوشتن، صحبت و بقیه را با دقیقهٔ ۷ روز اخیر مقایسه می‌کند و ضعیف‌ترین مهارت را نشان می‌دهد. از اینجا یا زمان سریع ثبت می‌کنی، یا می‌روی سراغ تمرین واقعی واژگان، شنیداری و mock.",
            },
            {
              name: "واژگان",
              body: "کارت واژه با مرور فاصله‌دار. عدد روی زبانه یعنی چند کارت امروز موعد دارد. کارت را ببین، معنی را چک کن، و کیفیت یادآوری را ثبت کن تا نوبت بعدی جابه‌جا شود.",
            },
            {
              name: "شنیداری",
              body: "کلیپ صوتی اضافه کن، گوش بده، و برای همان کلیپ یادداشت یا تمرین بگذار. عدد زبانه تعداد کلیپ‌هاست.",
            },
            {
              name: "آزمون‌ها",
              body: "Mock برای MSRT، IELTS، TOEFL، TOLIMO، EPT یا آزمون دلخواه. بعد از آزمون کارنامه، ضعیف‌ترین بخش، و امکان آزمون دوباره را می‌بینی. قالب MSRT یعنی شنیداری، گرامر و خواندن.",
            },
            {
              name: "یادداشت‌ها",
              body: "نکتهٔ زبانی را همین‌جا بنویس. اگر خواستی به یک سند کامل تبدیل می‌شود و در نوشته‌ها باز می‌گردد.",
            },
          ],
        },
        {
          type: "tip",
          body: "واژگان و شنیداری تمرین اصلی‌اند. ثبت دقیقه در مهارت‌ها فقط زمان را نگه می‌دارد و جای مرور کارت را نمی‌گیرد.",
        },
      ],
    },
    {
      id: "review",
      group: "مرور",
      title: "بازبینی هفته",
      summary:
        "جمع‌بندی آخر هفته: چه تمام شد، چه باز ماند، چه چیزی هنوز در اینباکس است، و چند ساعت ثبت کرده‌ای.",
      href: "/review",
      module: "review",
      blocks: [
        {
          type: "steps",
          title: "هفته را ببند",
          items: [
            "چهار عدد بالا را بخوان: باز، اینباکس، تمام، ساعت.",
            "فهرست تمام‌شدهٔ این هفته را ببین تا مشخص شود واقعاً چه بسته شده.",
            "ناتمام‌ها را نگاه کن. هر کدام را یا به هفتهٔ بعد متعهد کن، یا وضعیتش را روی بورد عوض کن.",
            "اینباکس را خالی کن: کارهایی که هنوز هفته ندارند را به «این هفته» بفرست، یا اگر مال این دوره نیستند در اینباکس نگه دار.",
            "اگر خواستی روایت هفته را بنویسی، یادداشت بازبینی را در نوشته‌ها باز کن.",
          ],
        },
      ],
    },
    {
      id: "hours",
      group: "مرور",
      title: "ساعت‌ها",
      summary:
        "جمع ساعت‌هایی که از داخل کارها ثبت کرده‌ای. این صفحه خودش ساعت جدید نمی‌سازد؛ گزارش همان ثبت‌هاست.",
      href: "/work-logs",
      module: "workLogs",
      blocks: [
        {
          type: "steps",
          title: "ساعت را درست ثبت کن",
          items: [
            "کار را از بورد یا جدول باز کن و ساعت ثبت کن.",
            "مدت را انتخاب کن (از ربع ساعت به بالا)، تاریخ را بگذار، و اگر لازم است شرح کار را بنویس.",
            "بعد به «ساعت‌ها» برگرد. بازهٔ تاریخ و در صورت نیاز حوزه یا مسیر را فیلتر کن.",
            "جمع ساعت، تعداد ورود، و تفکیک بر اساس کار، مسیر و تاریخ را ببین.",
          ],
        },
        {
          type: "tip",
          body: "اگر این صفحه خالی است، هنوز از داخل یک کار ساعت ثبت نکرده‌ای. ثبت ساعت به خود کار وصل است تا بعداً بدانی زمان صرف چه شده.",
        },
      ],
    },
    {
      id: "reports",
      group: "مرور",
      title: "گزارش‌گیری",
      summary:
        "خروجی اکسل از همان ساعت‌ها، برای یک بازهٔ تاریخ. مناسب وقتی باید گزارش کار را جایی تحویل بدهی.",
      href: "/reporting",
      module: "reporting",
      blocks: [
        {
          type: "steps",
          title: "فایل را بگیر",
          items: [
            "بازه را با تاریخ شروع و پایان مشخص کن.",
            "«تولید گزارش» را بزن و صبر کن تا فایل دانلود شود.",
            "ستون‌ها روز هفته، تاریخ، جمع ساعات، ساعات اضافه‌کاری، و متن گزارش کار هر روز را دارند.",
          ],
        },
        {
          type: "tip",
          body: "گزارش از ساعت‌هایی ساخته می‌شود که خودت ثبت کرده‌ای. اگر در آن بازه ساعتی نباشد، فایل داده‌ای برای نشان دادن ندارد.",
        },
      ],
    },
    {
      id: "account",
      group: "پیرامون",
      title: "جستجو، اعلان، پروفایل و تنظیمات",
      summary:
        "ابزارهایی که دور همه‌جا هستند: پیدا کردن یک چیز، خبر داخل برنامه، مشخصات خودت، و ظاهر سامانه.",
      blocks: [
        {
          type: "details",
          title: "هر کدام کجاست",
          items: [
            {
              name: "جستجو",
              body: "روی دسکتاپ Ctrl+K (در مک Cmd+K) و روی گوشی آیکون ذره‌بین بالای صفحه. حداقل دو حرف بنویس. کار، نوشته، مسیر، واژه، منبع، کلیپ شنیداری و ساعت ثبت‌شده پیدا می‌شود. نام کاربرهای دیگر برای عضو در نتایج نمی‌آید.",
            },
            {
              name: "منوی گوشی",
              body: "زیر عرض بزرگ، منوی کناری جمع می‌شود. دکمهٔ منو بالا را بزن تا همان تب‌ها، از جمله همین راهنما، باز شوند.",
            },
            {
              name: "اعلان‌ها",
              body: "زنگ کنار پایین منو. برای واگذاری، تغییر کار، دیدگاه، نزدیک شدن مهلت و تغییر وضعیت. از تنظیمات می‌توانی اعلان داخل برنامه، صدا، و در صورت آماده بودن ایمیل را جداگانه خاموش و روشن کنی.",
            },
            {
              name: "پروفایل",
              body: "نام و عکس (JPG یا PNG یا WebP، تا ۲ مگابایت). ایمیل ثابت است. رمز را با رمز فعلی و رمز جدید عوض می‌کنی.",
            },
            {
              name: "تنظیمات",
              body: "زبان رابط فارسی یا انگلیسی، و پوستهٔ روشن، تیره، یا هماهنگ با سیستم.",
            },
          ],
        },
        {
          type: "links",
          items: [
            { href: "/notifications", label: "اعلان‌ها" },
            { href: "/profile", label: "پروفایل" },
            { href: "/settings", label: "تنظیمات" },
          ],
        },
      ],
    },
    {
      id: "admin",
      group: "مدیریت",
      title: "کاربرها و ماژول‌ها",
      summary:
        "حساب مدیر فضای شخصی ندارد. کارش ساختن عضو، دادن رمز موقت، و روشن کردن بخش‌هایی است که هر عضو می‌بیند.",
      href: "/users",
      adminOnly: true,
      blocks: [
        {
          type: "steps",
          title: "یک عضو جدید",
          items: [
            "از «کاربرها» ایجاد کاربر را بزن. نام و ایمیل را وارد کن.",
            "رمز موقت را همان لحظه کپی کن و به خود شخص بده. بعد از ورود اول، از پروفایل عوضش می‌کند.",
            "نقش عضو برای فضای شخصی است. نقش مدیر فقط برای همین صفحهٔ مدیریت است و بیشتر از یک مدیر ساخته نمی‌شود.",
            "وضعیت فعال یا غیرفعال تعیین می‌کند که بتواند وارد شود یا نه.",
            "در ویرایش کاربر، ماژول‌ها را تیک بزن.",
          ],
        },
        {
          type: "details",
          title: "ماژول‌ها به هم وابسته‌اند",
          items: [
            {
              name: "کارها",
              body: "جدول کار، و همراهش بورد، تقویم و بازبینی هفته. اگر خاموش شود، ساعت‌ها و گزارش‌گیری هم خاموش می‌شوند.",
            },
            {
              name: "نوشته‌ها و پژوهش",
              body: "پژوهش فقط وقتی روشن می‌ماند که نوشته‌ها هم روشن باشد. روشن کردن پژوهش، نوشته‌ها را هم روشن می‌کند.",
            },
            {
              name: "زبان، عادت، حوزه‌ها",
              body: "زبان هاب تمرین را نشان می‌دهد. عادت کارت روی صفحهٔ امروز است. حوزه‌ها صفحهٔ مسیرها را باز می‌کند.",
            },
            {
              name: "ساعت‌ها و گزارش",
              body: "هر کدام روشن شود، کارها را هم لازم دارد. گزارش همان ساعت‌های ثبت‌شده را به اکسل تبدیل می‌کند.",
            },
          ],
        },
        {
          type: "tip",
          body: "راهنما برای عضو و مدیر هر دو در منو هست. مدیر با باز کردن تب‌های شخصی به فضای یک عضو وارد نمی‌شود.",
        },
      ],
    },
  ],
};

const en: GuideCopy = {
  kicker: "Learn",
  title: "Mindora guide",
  intro:
    "Mindora is a private space for one person: work, research, language, and life together, without anyone else’s tasks. This guide walks through each part as it actually works, from the morning page to the end-of-week spreadsheet.",
  searchPlaceholder: "Search the guide… vocab, board, hours",
  searchEmpty: "Nothing matched. Try a shorter word.",
  open: "Open this section",
  off: "This section is turned off for your account.",
  adminBanner:
    "This guide also describes the member space. From this account only Users opens; the personal tabs belong to the members you create.",
  adminBadge: "Admin only",
  tocLabel: "Guide contents",
  backToTop: "Back to top",
  startTitle: "A normal day",
  starts: [
    {
      id: "today",
      title: "Morning, on Today",
      text: "See what’s due, pick three priorities, and tick habits first.",
    },
    {
      id: "board",
      title: "Midday, on the board",
      text: "Drag a card between columns as the work moves.",
    },
    {
      id: "review",
      title: "Week’s end, review",
      text: "See what finished, what remains, and set up next week.",
    },
  ],
  sections: [
    {
      id: "space",
      group: "Start",
      title: "Your private space",
      summary:
        "Each member has a separate space. Your tasks, docs, vocab, and hours stay yours, and other members’ names do not show up in filters.",
      blocks: [
        {
          type: "details",
          title: "Four areas",
          items: [
            {
              name: "PhD",
              body: "Research, chapters, papers, and sources. The research pipeline sits on this area.",
            },
            {
              name: "Work",
              body: "Job tasks and the paths tied to day-to-day work.",
            },
            {
              name: "Life",
              body: "Personal tasks outside study and the job.",
            },
            {
              name: "Language",
              body: "Sessions, vocab, listening, and exams. The language hub goes deeper on this area.",
            },
          ],
        },
        {
          type: "details",
          title: "Area and path",
          items: [
            {
              name: "Area",
              body: "There are four, and you cannot add a fifth: PhD, Work, Life, and Language.",
            },
            {
              name: "Path",
              body: "A name you create under an area. In Research those are the PhD paths, and in Language those are the language paths. The app calls all of them paths.",
            },
          ],
        },
        {
          type: "tip",
          body: "If a tab is missing, that module is off for your account. Calendar, board, and weekly review appear when Tasks is on. Research cannot stay on without Docs.",
        },
      ],
    },
    {
      id: "today",
      group: "Daily",
      title: "Today",
      summary:
        "The page you open each morning. Due today, overdue, inbox, the week’s load, three priorities, habits, and a focus session live here.",
      href: "/dashboard",
      module: "dashboard",
      blocks: [
        {
          type: "steps",
          title: "Open the morning like this",
          items: [
            "Choose Today in the menu.",
            "If yesterday’s unfinished work shows a banner, bring all of it onto today.",
            "The three priorities are always three slots. Choose a task lists overdue work, work due today, and work with no date. Tomorrow and the rest of the week stay out. As you finish them, the counter reads like 2/3 ✓.",
            "Tick habits. The streak and activity strip update in place.",
            "In Today’s focus, pick a task and start a session: 15, 25, or 50 minutes. When it ends, or you save and stop, those minutes land on Hours and reports. Breaks are not logged.",
          ],
        },
        {
          type: "details",
          title: "What’s on the page",
          items: [
            {
              name: "Focus today",
              body: "A real session: pick a task, focus for 15, 25, or 50 minutes, then a break. The focus time is saved on that task in Hours and reports.",
            },
            {
              name: "Needs attention",
              body: "Shows only what needs you: overdue tasks, vocab ready to review, a source still to read, or minutes left on the language goal. If none of those are waiting, it says all clear.",
            },
            {
              name: "Lists",
              body: "The Today list is what is due that day. Beside it are three tabs: Inbox, Overdue, and This week. Mark something done or send it into this week from here.",
            },
            {
              name: "Week strip",
              body: "Shows the load of the days ahead so today sits next to the whole week.",
            },
            {
              name: "Areas",
              body: "Shortcuts into PhD, work, life, and language.",
            },
            {
              name: "Habits",
              body: "Add a habit by name. Tick today, undo today, archive, and the activity map. If the card is missing, the habits module is off.",
            },
            {
              name: "Quick capture with N",
              body: "The sentence is read by rules, not a model. The default is a task. “idea:” creates a note and “habit:” a habit. Today, tomorrow, tonight, “in two days”, “next week”, a weekday, and “by Friday” set the day. Say the clock with “at 10” or with morning, noon, evening, and night. A paper or research task is saved under PhD and does not appear on Today; it is on All tasks and the board. The word “task” alone does not change the area.",
            },
          ],
        },
        {
          type: "tip",
          body: "Press N outside a text field to open quick capture. Ctrl+K stays search. Open “How a sentence is read” in that window. The chips are exactly what will be saved.",
        },
      ],
    },
    {
      id: "board",
      group: "Daily",
      title: "Board",
      summary:
        "The same tasks as columns. Drag a card to change its status: Inbox, This week, In progress, Feedback, Testing, Done, and Waiting.",
      href: "/kanban",
      module: "kanban",
      blocks: [
        {
          type: "steps",
          title: "Move work on the board",
          items: [
            "Drag a card to the next column. On a phone, open the card and change the status in the form if dragging is awkward.",
            "Create a card with a title. Area, path, due date, priority, and labels can wait.",
            "Search narrows by title. Area, path, priority, and label filters sit beside it.",
            "Open a card for the description, comments, attachments, activity, and logged time.",
          ],
        },
        {
          type: "details",
          title: "What the columns mean",
          items: [
            { name: "Inbox", body: "Not planned into this week yet. Raw ideas live here." },
            { name: "This week", body: "You committed to it in the current week." },
            { name: "In progress", body: "You are on it now." },
            { name: "Feedback", body: "Waiting on a read, from an advisor or from you." },
            { name: "Testing", body: "Nearly done and needs one check." },
            { name: "Done", body: "Closed. It leaves the open lists on Today." },
            { name: "Waiting", body: "Stuck on something else." },
          ],
        },
        {
          type: "tip",
          body: "The board is yours. You don’t assign cards to other people, and members don’t get a people filter.",
        },
      ],
    },
    {
      id: "tasks",
      group: "Daily",
      title: "All tasks",
      summary:
        "The full table, with search, filters, and sorting. A task created anywhere else shows up here too.",
      href: "/tasks",
      module: "tasks",
      blocks: [
        {
          type: "steps",
          title: "Create a precise task",
          items: [
            "Choose Create task.",
            "Write a title. Add a description when it helps.",
            "Set status, priority (urgent, high, medium, low, none), and type (task, story, bug, epic).",
            "Pick an area, and a path if you have made one.",
            "Pick a due date. Repeat can be daily, weekly, or monthly.",
            "Create a colored label or reuse one.",
            "Save. Edit or delete later from the same row.",
          ],
        },
        {
          type: "details",
          title: "Inside a task",
          items: [
            {
              name: "Comments",
              body: "Leave a note. An @ mention only reaches people already on that task, which in a private space means you.",
            },
            {
              name: "Attachments and activity",
              body: "Files attach to the task. Activity records changes to status, priority, due date, labels, and description.",
            },
            {
              name: "Hours",
              body: "From the task, log time: duration, date, and an optional note. Those entries show up in Hours and Reporting.",
            },
            {
              name: "Repeat",
              body: "Skip the next occurrence, apply an edit to the whole series, set an end date, or stop the series.",
            },
            {
              name: "Table filters",
              body: "Title search, status, priority, area, and path. Labels appear when you have some. The title, path, status, priority, person, and due headers sort the table. Group by path, date, status, or area, and collapse a group with a click. If you have no work yet, the page asks you to create the first task. On a phone each row is a card; its menu edits or deletes.",
            },
          ],
        },
      ],
    },
    {
      id: "calendar",
      group: "Daily",
      title: "Calendar",
      summary:
        "Due dates on a Jalali calendar. Month for the overview, week for the days right in front of you.",
      href: "/calendar",
      module: "calendar",
      blocks: [
        {
          type: "steps",
          title: "Plan from the calendar",
          items: [
            "Switch between month and week, move with the arrows, and jump back with Today.",
            "Filter by all areas, or only PhD, work, life, or language.",
            "Select a day to list tasks due that day.",
            "Add a task for this day and it is created with that due date.",
          ],
        },
        {
          type: "tip",
          body: "A task with no due date never appears here. Set a date when you create or edit it.",
        },
      ],
    },
    {
      id: "areas",
      group: "Spaces",
      title: "Areas and paths",
      summary:
        "Home of the four areas. Each area is a fixed personal bucket. Paths inside it keep tasks from scattering.",
      href: "/projects",
      module: "projects",
      blocks: [
        {
          type: "steps",
          title: "Make a path and attach work",
          items: [
            "Open Areas & paths and choose one of the four areas.",
            "Create a path, such as “Paper review” under Work or “Methods chapter” under PhD.",
            "Inside the path, create tasks and read the counts: total, open, done, overdue, and completion.",
            "Jump from the path to the board or the full task table.",
          ],
        },
        {
          type: "tip",
          body: "Inviting someone onto a path is off. These buckets stay personal.",
        },
      ],
    },
    {
      id: "docs",
      group: "Spaces",
      title: "Docs",
      summary:
        "The editor for a daily note, a chapter, or any long text you need to keep. It saves as you write.",
      href: "/docs",
      module: "docs",
      blocks: [
        {
          type: "steps",
          title: "Take a doc from blank page to export",
          items: [
            "Create a doc, or start from a template: idea, chapter, source note, or literature review.",
            "Title it and write. Type / for headings, lists, checklists, quotes, code, links, tables, images, and footnotes.",
            "The toolbar does the same with buttons: bold, italic, strike, H1 to H3.",
            "Give it a folder and tags, and an area when that helps you find it later.",
            "Move status between idea, drafting, review, and ready.",
            "Save a manual version when the text matters. An automatic version is also kept before an important edit. Compare two versions side by side and restore one.",
            "Export Markdown, Word, or print / PDF.",
          ],
        },
        {
          type: "details",
          title: "The side panel",
          items: [
            {
              name: "Outline",
              body: "Built from H1, H2, and H3. Click a heading to jump there.",
            },
            {
              name: "Tasks",
              body: "Link an existing task, or create one from the doc title. A text selection can become a task. Checklist items can be previewed and turned into separate tasks.",
            },
            {
              name: "Sources and quotes",
              body: "A source has title, authors, year, link, and notes. Attach a PDF, select text, save a quote, then insert that quote into the doc.",
            },
            {
              name: "Word goal and writing pulse",
              body: "Set a word target on the doc. Writing pulse points at docs that have gone quiet.",
            },
            {
              name: "Focus mode",
              body: "Hides the surroundings so the text is what’s left.",
            },
            {
              name: "Daily note",
              body: "Opens one doc for the day, from Docs or from the research panel.",
            },
            {
              name: "Archive and trash",
              body: "Archive a doc, or send it to trash. Trashed docs can return for 30 days. Permanent delete is a separate step.",
            },
          ],
        },
      ],
    },
    {
      id: "research",
      group: "Spaces",
      title: "Research",
      summary:
        "The PhD hub with three tabs: a task pipeline, a source library, and a writing desk. Everything here is in the PhD area.",
      href: "/research",
      module: "research",
      blocks: [
        {
          type: "steps",
          title: "Start one research line",
          items: [
            "If you have several papers, create a path at the top and name it. All shows everything. Inbox is work and docs with no path.",
            "On the pipeline tab, move cards through Idea, Reading, Writing, Feedback, and Done / submitted.",
            "From the side panel, open today’s note or a template (idea, chapter, source, literature review). It is created in Docs.",
            "In the library, add a source. A DOI lookup fills the fields. Set reading status to to-read, reading, or done.",
            "Attach a PDF, copy a citation, or export BibTeX for the library.",
            "On the writing tab, create the default PhD folders and find quiet docs in the writing pulse.",
          ],
        },
        {
          type: "tip",
          body: "The pipeline is your PhD tasks with research labels, not a second list. Finishing a card here means that task reached the last column.",
        },
      ],
    },
    {
      id: "language",
      group: "Spaces",
      title: "Language",
      summary:
        "The practice hub with six tabs: Today, Skills, Vocab, Listening, Exams, and Notes.",
      href: "/language",
      module: "language",
      blocks: [
        {
          type: "details",
          title: "What each tab does",
          items: [
            {
              name: "Today",
              body: "Log a session with minutes and an optional note. See the weekly goal, minutes so far, the streak, and recent sessions. A language path (one exam, for example) filters the hub from the top.",
            },
            {
              name: "Skills",
              body: "Compares grammar, reading, writing, speaking, and the rest over the last 7 days and marks the weakest. Log time quickly, or jump into real vocab, listening, and mock practice.",
            },
            {
              name: "Vocab",
              body: "Flashcards with spaced review. The count on the tab is how many cards are due. Reveal a card, check the meaning, and rate the recall so the next review moves.",
            },
            {
              name: "Listening",
              body: "Add an audio clip, listen, and keep a note or drill on that clip. The tab count is how many clips you have.",
            },
            {
              name: "Exams",
              body: "Mocks for MSRT, IELTS, TOEFL, TOLIMO, EPT, or a custom exam. Afterward you get a scorecard, the weakest section, and a retake. MSRT is listening, grammar, and reading.",
            },
            {
              name: "Notes",
              body: "Write a language note here. It can become a full doc and open in Docs.",
            },
          ],
        },
        {
          type: "tip",
          body: "Vocab and listening are the real practice. Logging minutes on Skills only stores time; it does not replace a card review.",
        },
      ],
    },
    {
      id: "review",
      group: "Reflect",
      title: "Weekly review",
      summary:
        "The end-of-week close: what finished, what is still open, what is still in the inbox, and how many hours you logged.",
      href: "/review",
      module: "review",
      blocks: [
        {
          type: "steps",
          title: "Close the week",
          items: [
            "Read the four numbers: open, inbox, done, hours.",
            "Scan what you finished this week.",
            "Look at leftovers. Commit each one to next week, or change its status on the board.",
            "Empty the inbox: send unplanned work into this week, or leave it in the inbox if it does not belong yet.",
            "Open the weekly review note in Docs if you want a written recap.",
          ],
        },
      ],
    },
    {
      id: "hours",
      group: "Reflect",
      title: "Hours",
      summary:
        "The hours you logged from inside tasks. This page does not create a new entry; it reports the ones you already saved.",
      href: "/work-logs",
      module: "workLogs",
      blocks: [
        {
          type: "steps",
          title: "Log time in the right place",
          items: [
            "Open a task from the board or the table and log time.",
            "Pick a duration (from a quarter hour up), set the date, and write a note if you need one.",
            "Come back to Hours. Filter by date range and, if you want, by area or path.",
            "Read total hours, entry count, and the split by task, path, and date.",
          ],
        },
        {
          type: "tip",
          body: "An empty page means you have not logged time on a task yet. Time stays attached to the task so you can see what it was spent on.",
        },
      ],
    },
    {
      id: "reports",
      group: "Reflect",
      title: "Reporting",
      summary:
        "An Excel file of those same hours for a date range, for when you need to hand in a work report.",
      href: "/reporting",
      module: "reporting",
      blocks: [
        {
          type: "steps",
          title: "Download the file",
          items: [
            "Set a start and end date.",
            "Generate the report and wait for the download.",
            "Columns cover weekday, date, total hours, overtime hours, and the written work note for each day.",
          ],
        },
        {
          type: "tip",
          body: "The file is built from time you logged. A range with no hours has nothing to show.",
        },
      ],
    },
    {
      id: "account",
      group: "Around",
      title: "Search, alerts, profile, and settings",
      summary:
        "The tools that sit around everything else: finding one thing, in-app news, your own details, and how the app looks.",
      blocks: [
        {
          type: "details",
          title: "Where each one is",
          items: [
            {
              name: "Search",
              body: "Ctrl+K on Windows (Cmd+K on Mac), or the magnifying glass in the phone header. Type at least two characters. It finds tasks, docs, paths, vocab, sources, listening clips, and logged time. Other people’s names stay out of a member’s results.",
            },
            {
              name: "Phone menu",
              body: "Below a large screen the sidebar collapses. The menu button at the top opens the same tabs, including this guide.",
            },
            {
              name: "Notifications",
              body: "The bell at the bottom of the menu. Assignment, task changes, comments, approaching deadlines, and status changes. Settings can turn in-app alerts, sound, and email (when mail is configured) on or off separately.",
            },
            {
              name: "Profile",
              body: "Name and photo (JPG, PNG, or WebP, up to 2 MB). Email stays fixed. Change the password with the current one and a new one.",
            },
            {
              name: "Settings",
              body: "Interface language, Persian or English, and a light, dark, or system theme.",
            },
          ],
        },
        {
          type: "links",
          items: [
            { href: "/notifications", label: "Notifications" },
            { href: "/profile", label: "Profile" },
            { href: "/settings", label: "Settings" },
          ],
        },
      ],
    },
    {
      id: "admin",
      group: "Admin",
      title: "Users and modules",
      summary:
        "The admin account has no private workspace. It creates members, hands out a temporary password, and turns on the sections each member can see.",
      href: "/users",
      adminOnly: true,
      blocks: [
        {
          type: "steps",
          title: "Add a member",
          items: [
            "From Users, create a user and enter a name and email.",
            "Copy the temporary password immediately and give it to that person. They change it from Profile after the first sign-in.",
            "Member is the private workspace. Admin is only this management screen, and there is a single admin.",
            "Active or inactive decides whether they can sign in.",
            "While editing the user, tick the modules they should have.",
          ],
        },
        {
          type: "details",
          title: "How modules depend on each other",
          items: [
            {
              name: "Tasks",
              body: "The task table, and with it the board, calendar, and weekly review. Turning it off also turns off Hours and Reporting.",
            },
            {
              name: "Docs and research",
              body: "Research stays on only while Docs is on. Turning research on turns Docs on too.",
            },
            {
              name: "Language, habits, areas",
              body: "Language shows the practice hub. Habits is the card on Today. Areas opens the paths page.",
            },
            {
              name: "Hours and reporting",
              body: "Either one needs Tasks. Reporting turns those logged hours into Excel.",
            },
          ],
        },
        {
          type: "tip",
          body: "The guide stays in the menu for both members and the admin. Opening a personal tab does not drop the admin into a member’s space.",
        },
      ],
    },
  ],
};

export function guideCopy(language: "FA" | "EN"): GuideCopy {
  return language === "FA" ? fa : en;
}
