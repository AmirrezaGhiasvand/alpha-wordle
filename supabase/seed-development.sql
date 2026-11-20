-- ORIGINAL DEVELOPMENT FIXTURES ONLY. Not an audited production dictionary.
-- Run only on development/staging projects. Review and expand before public launch.
insert into wordle_private.words(word,eligible) values
('باران',true),('آسمان',true),('ایران',true),('پنجره',true),('پرواز',true),('ستاره',true),
('پاییز',true),('تابان',true),('آرامش',true),('گلدان',true),('همراه',true),('روستا',true),
('شادان',true),('میدان',true),('بیمار',true),('درمان',true),('ورزشی',true),('مهمان',true),
('انسان',true),('بهانه',true),('بهاری',true),('شمارش',true),('امروز',true),('دیروز',true),
('فردوس',true),('روزنه',true),('سپیده',true),('بادام',true),('دستان',true),('کارگر',true),
('مهتاب',true),('محبوب',true),('برادر',true),('خواهر',true),('آینده',true),('آموزش',true),
('آموزه',true),('آزمون',true),('کتابی',true),('مدادی',true),('دبیری',true),('دقیقه',true),
('ثانیه',true),('ستایش',true),('اندوه',true),('علاقه',true),('طوفان',true),('فنجان',true),('بشقاب',true)
on conflict do nothing;
