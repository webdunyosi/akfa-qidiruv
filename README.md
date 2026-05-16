# Akfa Plast - Mahsulot Qidiruv Tizimi

Bu loyiha Akfa Plast mahsulotlarini tez va oson qidirib topish uchun mo'ljallangan veb-ilovadir. Foydalanuvchilar mahsulotlarni profil seriyasi, nomi yoki SAP kodi bo'yicha izlashlari mumkin.

🌐 **Jonli namuna:** [https://akfa-qidiruv.vercel.app/](https://akfa-qidiruv.vercel.app/)

## 🚀 Asosiy Xususiyatlar

- **Tezkor qidiruv:** Mahsulotlarni Profil seriyasi, Mahsulot nomi yoki SAP kodi bo'yicha filtrlash.
- **Avtomatik takliflar (Autocomplete):** Qidiruv maydoniga yozishni boshlashingiz bilan tizim mavjud variantlarni taklif qiladi va klaviatura (Arrow tugmalari va Enter) orqali boshqarish imkonini beradi.
- **Dark/Light Mode:** Foydalanuvchi ko'zi toliqmasligi uchun tungi va kunduzgi rejimlar qo'llab-quvvatlanadi.
- **Responsive dizayn:** Mobil qurilmalar, planshetlar va kompyuterlar uchun moslashtirilgan.
- **Ma'lumotlarni yangilash:** Ma'lumotlarni qayta yuklash uchun maxsus "Yangilash" tugmasi mavjud.

## 🛠 Ishlatilgan Texnologiyalar

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Styling:** Tailwind CSS (CDN orqali)
- **Ma'lumotlar bazasi (API):** Google Apps Script (Google Sheets'dan ma'lumotlarni o'qib JSON formatida qaytaradi)
- **Ikonkalar:** Boxicons

## 📂 Loyiha Tuzilmasi

```
akfa-qidiruv/
├── images/           # Rasm va logotiplar papkasi
├── js/               # JavaScript fayllar
│   └── script.js     # Asosiy dastur logikasi, API bilan ishlash va qidiruv tizimi
├── index.html        # Asosiy HTML sahifa
├── style.css         # Qo'shimcha stillar
└── README.md         # Loyiha haqida ma'lumot
```

## ⚙️ O'rnatish va Ishga Tushirish

Ushbu loyihani o'z kompyuteringizda ishga tushirish uchun quyidagi qadamlarni bajaring:

1. **Loyihani yuklab oling yoki klonlang:**
   ```bash
   git clone https://github.com/webdunyosi/akfa-qidiruv.git
   ```
2. **Loyihani oching:**
   Papkani VS Code kabi istalgan kod muharririda oching.
3. **Ishga tushirish:**
   Loyihani brauzerda ko'rish uchun `index.html` faylini ikki marta bosing yoki VS Code'da "Live Server" plaginidan foydalaning.

### 🔗 API va Ma'lumotlar ulanishi
Loyiha ma'lumotlarni Google Sheets orqali oladi. `js/script.js` faylining eng yuqori qismida `scriptURL` o'zgaruvchisi Google Apps Script manziliga ulangan:
```javascript
const scriptURL = "https://script.google.com/macros/s/.../exec";
```
Agar o'z ma'lumotlar bazangizni (Google Sheet) ulamoqchi bo'lsangiz, shu URL manzilni o'zgartirishingiz kerak bo'ladi.

## 🤝 Hissa Qo'shish

Agar loyihani rivojlantirishga o'z hissangizni qo'shmoqchi bo'lsangiz, *Pull Request* jo'natishingiz yoki *Issue* ochishingiz mumkin. Barcha takliflar qabul qilinadi!
