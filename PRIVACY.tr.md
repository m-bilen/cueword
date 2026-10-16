# Cueword Gizlilik Politikası

Son güncelleme: Ekim 2026

[English version](PRIVACY.md)

Cueword, altyazıda seçtiğin kelimeleri açıklayan ve onları tekrar etmene yardım eden bir Chrome eklentisi. Bu sayfa, eklentinin hangi verileri nasıl kullandığını tam olarak anlatıyor. Cueword açık kaynak, yani buradaki her iddiayı kodda kendin kontrol edebilirsin: https://github.com/m-bilen/cueword

## Kısaca

- Kelimelerin, notların ve ayarların senin tarayıcında kalır.
- Tarayıcından çıkan tek şey seçtiğin metindir. O da senin kendi API key'inle Google Gemini'ye gönderilir.
- Geliştirici hiçbir verine erişmez. Sunucu yok, hesap yok, analitik yok, takip yok.
- Cueword verilerini satmaz ve aşağıda anlatıldığı gibi Google'ın Gemini API'si dışında kimseyle paylaşmaz.

## Cueword neleri saklar

Cueword'ün kaydettiği her şey senin tarayıcında, Chrome'un eklentilere ayırdığı yerel depolama alanında durur:

- seçtiğin kelimeler, replikler ve açıklamaları
- geçtikleri altyazı cümlesi
- seçtiğin andaki video zamanı ve sayfa adresi
- başlık (dizi ya da film) adların
- tekrar ilerlemen
- Gemini API key'in dahil ayarların

API key'in, diğer ayarların gibi bu yerel depolamada düz metin olarak saklanır. Başka siteler ve başka eklentiler onu okuyamaz, ama bilgisayarındaki Chrome profiline erişimi olan biri okuyabilir. Key yalnızca her istekle birlikte Google'ın Gemini API'sine gönderilir.

## Cueword neyi, kime gönderir

Bir kelime seçtiğinde Cueword, seçtiğin metni ve etrafındaki altyazı cümlesini şifreli (HTTPS) bir bağlantı üzerinden, senin kendi API key'inle Google Gemini API'sine gönderir. Başka hiçbir şey gönderilmez: sayfa adresi, video zamanı ya da diğer kelimelerin gitmez.

Google bu isteği kendi şartlarına göre işler: [Gemini API Ek Hizmet Şartları](https://ai.google.dev/gemini-api/terms) ve [Google Gizlilik Politikası](https://policies.google.com/privacy). Ücretsiz bir API key kullanıyorsan, Google'ın şartları gönderdiğin içeriği ürünlerini geliştirmek için kullanmasına izin verir ve bu içeriği insan değerlendiriciler okuyabilir. Ücretli bir key'de Google içeriğini bu şekilde kullanmadığını belirtir. Cueword yalnızca senin seçtiğin metni gönderir, yine de kişisel ya da hassas metinleri seçmekten kaçın.

Verilerin yalnızca seçimlerini açıklamak ve onları tekrar etmeni sağlamak için kullanılır. Reklam ya da başka herhangi bir amaçla kullanılmaz.

## Cueword sayfaları nasıl okur

Altyazılar birçok farklı yayın sitesinde göründüğü için Cueword ziyaret ettiğin her sayfada çalışır. Bu sayfalarda yalnızca Alt tuşuna basılı tutup tutmadığına bakar, yazdıklarını kaydetmez. Metni yalnızca Alt'a basılı tutup bir şey seçtiğinde okur. O zaman da sadece seçimi ve etrafındaki altyazı satırını ya da paragrafı okur. Arka planda sayfa okumaz, toplamaz, göndermez.

## İzinler

- **storage:** kelimelerini ve ayarlarını tarayıcında saklamak için.
- **sidePanel:** kelime listeni videonun yanında göstermek için.
- **generativelanguage.googleapis.com erişimi:** seçimini Gemini'ye göndermek için.
- **Tüm sitelere erişim:** yukarıda anlatıldığı gibi, herhangi bir yayın sitesinde altyazı seçebilmen için.

## Verilerini silmek

Kelimelerini ve başlıklarını istediğin zaman panelden silebilirsin. Eklentiyi kaldırdığında, sakladığı bütün veriler tarayıcından silinir.

## Yaş

Google'ın Gemini API'sini yalnızca 18 yaşında ya da daha büyük olanlar kullanabilir. Cueword 18 yaşından küçükler için tasarlanmamıştır.

## Değişiklikler

Bu politika değişirse yeni hâli yeni tarihiyle burada yayınlanır. İki dil arasında bir fark olursa İngilizce metin esas alınır.

## İletişim

bilen.mehmet2408@gmail.com