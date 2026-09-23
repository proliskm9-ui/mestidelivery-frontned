/**
 * MestiDelivery - World-Class International Phone Verification (SMS OTP)
 * - Real-time auto-detection by country dial code
 * - Crisp Retina flag graphics (FlagCDN) with Unicode emoji fallback
 * - 248 countries with localized search & quick-access chips
 * - Native MestiDelivery luxury dark design tokens (#141413, #21EA7C)
 * - Seamless 6-digit OTP code distribution & auto-submission
 */
(function () {
  'use strict';

  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyBrnQdbF_RJhBTJmxSKPOsQWwZ9An_mML8",
    authDomain: "mestidelivery.firebaseapp.com",
    projectId: "mestidelivery",
    storageBucket: "mestidelivery.firebasestorage.app",
    messagingSenderId: "472806415041"
  };

  var COUNTRIES = [{"code": "GE", "name": "Грузия", "nameEn": "Georgia", "nameKa": "საქართველო", "dial": "+995", "flag": "🇬🇪", "mask": "### ##-##-##", "priority": 1}, {"code": "RU", "name": "Россия", "nameEn": "Russia", "nameKa": "რუსეთი", "dial": "+7", "flag": "🇷🇺", "mask": "(###) ###-##-##", "priority": 2}, {"code": "IL", "name": "Израиль", "nameEn": "Israel", "nameKa": "ისრაელი", "dial": "+972", "flag": "🇮🇱", "mask": "## ###-####", "priority": 3}, {"code": "TR", "name": "Турция", "nameEn": "Turkey", "nameKa": "თურქეთი", "dial": "+90", "flag": "🇹🇷", "mask": "(###) ###-####", "priority": 4}, {"code": "KZ", "name": "Казахстан", "nameEn": "Kazakhstan", "nameKa": "ყაზახეთი", "dial": "+7", "flag": "🇰🇿", "mask": "(###) ###-##-##", "priority": 5}, {"code": "UA", "name": "Украина", "nameEn": "Ukraine", "nameKa": "უკრაინა", "dial": "+380", "flag": "🇺🇦", "mask": "(##) ###-##-##", "priority": 6}, {"code": "AM", "name": "Армения", "nameEn": "Armenia", "nameKa": "სომხეთი", "dial": "+374", "flag": "🇦🇲", "mask": "## ###-###", "priority": 7}, {"code": "AZ", "name": "Азербайджан", "nameEn": "Azerbaijan", "nameKa": "აზერბაიჯანი", "dial": "+994", "flag": "🇦🇿", "mask": "## ###-##-##", "priority": 8}, {"code": "BY", "name": "Беларусь", "nameEn": "Belarus", "nameKa": "ბელარუსი", "dial": "+375", "flag": "🇧🇾", "mask": "(##) ###-##-##", "priority": 9}, {"code": "UZ", "name": "Узбекистан", "nameEn": "Uzbekistan", "nameKa": "უზბეკეთი", "dial": "+998", "flag": "🇺🇿", "mask": "## ###-##-##", "priority": 10}, {"code": "US", "name": "США", "nameEn": "United States", "nameKa": "აშშ", "dial": "+1", "flag": "🇺🇸", "mask": "(###) ###-####", "priority": 11}, {"code": "DE", "name": "Германия", "nameEn": "Germany", "nameKa": "გერმანია", "dial": "+49", "flag": "🇩🇪", "mask": "#### #######", "priority": 12}, {"code": "GB", "name": "Великобритания", "nameEn": "United Kingdom", "nameKa": "დიდი ბრიტანეთი", "dial": "+44", "flag": "🇬🇧", "mask": "#### ######", "priority": 13}, {"code": "AE", "name": "ОАЭ", "nameEn": "United Arab Emirates", "nameKa": "არაბთა გაერთიანებული საამიროები", "dial": "+971", "flag": "🇦🇪", "mask": "## ###-####", "priority": 14}, {"code": "FR", "name": "Франция", "nameEn": "France", "nameKa": "საფრანგეთი", "dial": "+33", "flag": "🇫🇷", "mask": "# ## ## ## ##", "priority": 15}, {"code": "IT", "name": "Италия", "nameEn": "Italy", "nameKa": "იტალია", "dial": "+39", "flag": "🇮🇹", "mask": "### ###-####", "priority": 16}, {"code": "ES", "name": "Испания", "nameEn": "Spain", "nameKa": "ესპანეთი", "dial": "+34", "flag": "🇪🇸", "mask": "### ###-###", "priority": 17}, {"code": "PL", "name": "Польша", "nameEn": "Poland", "nameKa": "პოლონეთი", "dial": "+48", "flag": "🇵🇱", "mask": "### ###-###", "priority": 18}, {"code": "NL", "name": "Нидерланды", "nameEn": "Netherlands", "nameKa": "ნიდერლანდები", "dial": "+31", "flag": "🇳🇱", "mask": "# ########", "priority": 19}, {"code": "CH", "name": "Швейцария", "nameEn": "Switzerland", "nameKa": "შვეიცარია", "dial": "+41", "flag": "🇨🇭", "mask": "## ###-####", "priority": 20}, {"code": "AT", "name": "Австрия", "nameEn": "Austria", "nameKa": "ავსტრია", "dial": "+43", "flag": "🇦🇹", "mask": "### #######", "priority": 21}, {"code": "CZ", "name": "Чехия", "nameEn": "Czech Republic", "nameKa": "ჩეხეთი", "dial": "+420", "flag": "🇨🇿", "mask": "### ###-###", "priority": 22}, {"code": "GR", "name": "Греция", "nameEn": "Greece", "nameKa": "საბერძნეთი", "dial": "+30", "flag": "🇬🇷", "mask": "### ###-####", "priority": 23}, {"code": "CY", "name": "Кипр", "nameEn": "Cyprus", "nameKa": "კვიპროსი", "dial": "+357", "flag": "🇨🇾", "mask": "## ######", "priority": 24}, {"code": "SE", "name": "Швеция", "nameEn": "Sweden", "nameKa": "შვედეთი", "dial": "+46", "flag": "🇸🇪", "mask": "## ###-####", "priority": 25}, {"code": "NO", "name": "Норвегия", "nameEn": "Norway", "nameKa": "ნორვეგია", "dial": "+47", "flag": "🇳🇴", "mask": "### ## ###", "priority": 26}, {"code": "DK", "name": "Дания", "nameEn": "Denmark", "nameKa": "დანია", "dial": "+45", "flag": "🇩🇰", "mask": "## ## ## ##", "priority": 27}, {"code": "FI", "name": "Финляндия", "nameEn": "Finland", "nameKa": "ფინეთი", "dial": "+358", "flag": "🇫🇮", "mask": "### #######", "priority": 28}, {"code": "BE", "name": "Бельгия", "nameEn": "Belgium", "nameKa": "ბელგია", "dial": "+32", "flag": "🇧🇪", "mask": "### ## ## ##", "priority": 29}, {"code": "PT", "name": "Португалия", "nameEn": "Portugal", "nameKa": "პორტუგალია", "dial": "+351", "flag": "🇵🇹", "mask": "### ###-###", "priority": 30}, {"code": "IE", "name": "Ирландия", "nameEn": "Ireland", "nameKa": "ირლანდია", "dial": "+353", "flag": "🇮🇪", "mask": "## ###-####", "priority": 31}, {"code": "RO", "name": "Румыния", "nameEn": "Romania", "nameKa": "რუმინეთი", "dial": "+40", "flag": "🇷🇴", "mask": "### ###-###", "priority": 32}, {"code": "HU", "name": "Венгрия", "nameEn": "Hungary", "nameKa": "უნგრეთი", "dial": "+36", "flag": "🇭🇺", "mask": "## ###-####", "priority": 33}, {"code": "BG", "name": "Болгария", "nameEn": "Bulgaria", "nameKa": "ბულგარეთი", "dial": "+359", "flag": "🇧🇬", "mask": "### ###-###", "priority": 34}, {"code": "SK", "name": "Словакия", "nameEn": "Slovakia", "nameKa": "სლოვაკეთი", "dial": "+421", "flag": "🇸🇰", "mask": "### ###-###", "priority": 35}, {"code": "HR", "name": "Хорватия", "nameEn": "Croatia", "nameKa": "ხორვატია", "dial": "+385", "flag": "🇭🇷", "mask": "## ###-####", "priority": 36}, {"code": "RS", "name": "Сербия", "nameEn": "Serbia", "nameKa": "სერბეთი", "dial": "+381", "flag": "🇷🇸", "mask": "## ###-####", "priority": 37}, {"code": "SI", "name": "Словения", "nameEn": "Slovenia", "nameKa": "სლოვენია", "dial": "+386", "flag": "🇸🇮", "mask": "## ###-###", "priority": 38}, {"code": "EE", "name": "Эстония", "nameEn": "Estonia", "nameKa": "ესტონეთი", "dial": "+372", "flag": "🇪🇪", "mask": "#### ####", "priority": 39}, {"code": "LV", "name": "Латвия", "nameEn": "Latvia", "nameKa": "ლატვია", "dial": "+371", "flag": "🇱🇻", "mask": "## ###-###", "priority": 40}, {"code": "LT", "name": "Литва", "nameEn": "Lithuania", "nameKa": "ლიეტუვა", "dial": "+370", "flag": "🇱🇹", "mask": "### #####", "priority": 41}, {"code": "MD", "name": "Молдова", "nameEn": "Moldova", "nameKa": "მოლდოვა", "dial": "+373", "flag": "🇲🇩", "mask": "#### ####", "priority": 42}, {"code": "ME", "name": "Черногория", "nameEn": "Montenegro", "nameKa": "მონტენეგრო", "dial": "+382", "flag": "🇲🇪", "mask": "## ###-###", "priority": 43}, {"code": "AL", "name": "Албания", "nameEn": "Albania", "nameKa": "ალბანეთი", "dial": "+355", "flag": "🇦🇱", "mask": "## ###-####", "priority": 44}, {"code": "MK", "name": "Северная Македония", "nameEn": "North Macedonia", "nameKa": "ჩრდილოეთ მაკედონია", "dial": "+389", "flag": "🇲🇰", "mask": "## ###-###", "priority": 45}, {"code": "BA", "name": "Босния и Герцеговина", "nameEn": "Bosnia and Herzegovina", "nameKa": "ბოსნია და ჰერცეგოვინა", "dial": "+387", "flag": "🇧🇦", "mask": "## ###-###", "priority": 46}, {"code": "IS", "name": "Исландия", "nameEn": "Iceland", "nameKa": "ისლანდია", "dial": "+354", "flag": "🇮🇸", "mask": "### ####", "priority": 47}, {"code": "LU", "name": "Люксембург", "nameEn": "Luxembourg", "nameKa": "ლუქსემბურგი", "dial": "+352", "flag": "🇱🇺", "mask": "### ###-###", "priority": 48}, {"code": "MT", "name": "Мальта", "nameEn": "Malta", "nameKa": "მალტა", "dial": "+356", "flag": "🇲🇹", "mask": "#### ####", "priority": 49}, {"code": "KG", "name": "Кыргызстан", "nameEn": "Kyrgyzstan", "nameKa": "ყირგიზეთი", "dial": "+996", "flag": "🇰🇬", "mask": "### ###-###", "priority": 50}, {"code": "TJ", "name": "Таджикистан", "nameEn": "Tajikistan", "nameKa": "ტაჯიკეთი", "dial": "+992", "flag": "🇹🇯", "mask": "## ###-####", "priority": 51}, {"code": "TM", "name": "Туркменистан", "nameEn": "Turkmenistan", "nameKa": "თურქმენეთი", "dial": "+993", "flag": "🇹🇲", "mask": "# ###-####", "priority": 52}, {"code": "SA", "name": "Саудовская Аравия", "nameEn": "Saudi Arabia", "nameKa": "საუდის არაბეთი", "dial": "+966", "flag": "🇸🇦", "mask": "# ###-####", "priority": 53}, {"code": "QA", "name": "Катар", "nameEn": "Qatar", "nameKa": "ყატარი", "dial": "+974", "flag": "🇶🇦", "mask": "#### ####", "priority": 54}, {"code": "KW", "name": "Кувейт", "nameEn": "Kuwait", "nameKa": "ქუვეითი", "dial": "+965", "flag": "🇰🇼", "mask": "#### ####", "priority": 55}, {"code": "BH", "name": "Бахрейн", "nameEn": "Bahrain", "nameKa": "ბაჰრეინი", "dial": "+973", "flag": "🇧🇭", "mask": "#### ####", "priority": 56}, {"code": "OM", "name": "Оман", "nameEn": "Oman", "nameKa": "ომანი", "dial": "+968", "flag": "🇴🇲", "mask": "#### ####", "priority": 57}, {"code": "JO", "name": "Иордания", "nameEn": "Jordan", "nameKa": "იორდანია", "dial": "+962", "flag": "🇯🇴", "mask": "# #### ####", "priority": 58}, {"code": "LB", "name": "Ливан", "nameEn": "Lebanon", "nameKa": "ლიბანი", "dial": "+961", "flag": "🇱🇧", "mask": "## ###-###", "priority": 59}, {"code": "IQ", "name": "Ирак", "nameEn": "Iraq", "nameKa": "ერაყი", "dial": "+964", "flag": "🇮🇶", "mask": "### ###-####", "priority": 60}, {"code": "IR", "name": "Иран", "nameEn": "Iran", "nameKa": "ირანი", "dial": "+98", "flag": "🇮🇷", "mask": "### ###-####", "priority": 61}, {"code": "EG", "name": "Египет", "nameEn": "Egypt", "nameKa": "ეგვიპტე", "dial": "+20", "flag": "🇪🇬", "mask": "### ###-####", "priority": 62}, {"code": "CA", "name": "Канада", "nameEn": "Canada", "nameKa": "კანადა", "dial": "+1", "flag": "🇨🇦", "mask": "(###) ###-####", "priority": 63}, {"code": "MX", "name": "Мексика", "nameEn": "Mexico", "nameKa": "მექსიკა", "dial": "+52", "flag": "🇲🇽", "mask": "### ###-####", "priority": 64}, {"code": "BR", "name": "Бразилия", "nameEn": "Brazil", "nameKa": "ბრაზილია", "dial": "+55", "flag": "🇧🇷", "mask": "(##) #####-####", "priority": 65}, {"code": "AR", "name": "Аргентина", "nameEn": "Argentina", "nameKa": "არგენტინა", "dial": "+54", "flag": "🇦🇷", "mask": "(###) ###-####", "priority": 66}, {"code": "CL", "name": "Чили", "nameEn": "Chile", "nameKa": "ჩილე", "dial": "+56", "flag": "🇨🇱", "mask": "# #### ####", "priority": 67}, {"code": "CO", "name": "Колумбия", "nameEn": "Colombia", "nameKa": "კოლუმბია", "dial": "+57", "flag": "🇨🇴", "mask": "### ###-####", "priority": 68}, {"code": "IN", "name": "Индия", "nameEn": "India", "nameKa": "ინდოეთი", "dial": "+91", "flag": "🇮🇳", "mask": "#####-#####", "priority": 69}, {"code": "CN", "name": "Китай", "nameEn": "China", "nameKa": "ჩინეთი", "dial": "+86", "flag": "🇨🇳", "mask": "### #### ####", "priority": 70}, {"code": "JP", "name": "Япония", "nameEn": "Japan", "nameKa": "იაპონია", "dial": "+81", "flag": "🇯🇵", "mask": "## ####-####", "priority": 71}, {"code": "KR", "name": "Южная Корея", "nameEn": "South Korea", "nameKa": "სამხრეთ კორეა", "dial": "+82", "flag": "🇰🇷", "mask": "## ####-####", "priority": 72}, {"code": "SG", "name": "Сингапур", "nameEn": "Singapore", "nameKa": "სინგაპური", "dial": "+65", "flag": "🇸🇬", "mask": "#### ####", "priority": 73}, {"code": "TH", "name": "Таиланд", "nameEn": "Thailand", "nameKa": "ტაილანდი", "dial": "+66", "flag": "🇹🇭", "mask": "## ###-####", "priority": 74}, {"code": "VN", "name": "Вьетнам", "nameEn": "Vietnam", "nameKa": "ვიეტნამი", "dial": "+84", "flag": "🇻🇳", "mask": "### ###-###", "priority": 75}, {"code": "ID", "name": "Индонезия", "nameEn": "Indonesia", "nameKa": "ინდონეზია", "dial": "+62", "flag": "🇮🇩", "mask": "###-###-####", "priority": 76}, {"code": "MY", "name": "Малайзия", "nameEn": "Malaysia", "nameKa": "მალაიზია", "dial": "+60", "flag": "🇲🇾", "mask": "##-### ####", "priority": 77}, {"code": "PH", "name": "Филиппины", "nameEn": "Philippines", "nameKa": "ფილიპინები", "dial": "+63", "flag": "🇵🇭", "mask": "### ###-####", "priority": 78}, {"code": "AU", "name": "Австралия", "nameEn": "Australia", "nameKa": "ავსტრალია", "dial": "+61", "flag": "🇦🇺", "mask": "### ###-###", "priority": 79}, {"code": "NZ", "name": "Новая Зеландия", "nameEn": "New Zealand", "nameKa": "ახალი ზელანდია", "dial": "+64", "flag": "🇳🇿", "mask": "### ###-####", "priority": 80}, {"code": "ZA", "name": "ЮАР", "nameEn": "South Africa", "nameKa": "სამხრეთ აფრიკა", "dial": "+27", "flag": "🇿🇦", "mask": "## ###-####", "priority": 81}, {"code": "AX", "name": "Аландские острова", "nameEn": "Åland Islands", "nameKa": "Åland Islands", "dial": "+35818", "flag": "🇦🇽", "mask": "### ###-####", "priority": 999}, {"code": "DZ", "name": "Алжир", "nameEn": "Algeria", "nameKa": "Algeria", "dial": "+213", "flag": "🇩🇿", "mask": "### ###-####", "priority": 999}, {"code": "AS", "name": "Американское Самоа", "nameEn": "American Samoa", "nameKa": "American Samoa", "dial": "+1684", "flag": "🇦🇸", "mask": "### ###-####", "priority": 999}, {"code": "AI", "name": "Ангилья", "nameEn": "Anguilla", "nameKa": "Anguilla", "dial": "+1264", "flag": "🇦🇮", "mask": "### ###-####", "priority": 999}, {"code": "AO", "name": "Ангола", "nameEn": "Angola", "nameKa": "Angola", "dial": "+244", "flag": "🇦🇴", "mask": "### ###-####", "priority": 999}, {"code": "AD", "name": "Андорра", "nameEn": "Andorra", "nameKa": "Andorra", "dial": "+376", "flag": "🇦🇩", "mask": "### ###-####", "priority": 999}, {"code": "AG", "name": "Антигуа и Барбуда", "nameEn": "Antigua and Barbuda", "nameKa": "Antigua and Barbuda", "dial": "+1268", "flag": "🇦🇬", "mask": "### ###-####", "priority": 999}, {"code": "AW", "name": "Аруба", "nameEn": "Aruba", "nameKa": "Aruba", "dial": "+297", "flag": "🇦🇼", "mask": "### ###-####", "priority": 999}, {"code": "AF", "name": "Афганистан", "nameEn": "Afghanistan", "nameKa": "Afghanistan", "dial": "+93", "flag": "🇦🇫", "mask": "### ###-####", "priority": 999}, {"code": "BS", "name": "Багамские Острова", "nameEn": "Bahamas", "nameKa": "Bahamas", "dial": "+1242", "flag": "🇧🇸", "mask": "### ###-####", "priority": 999}, {"code": "BD", "name": "Бангладеш", "nameEn": "Bangladesh", "nameKa": "Bangladesh", "dial": "+880", "flag": "🇧🇩", "mask": "### ###-####", "priority": 999}, {"code": "BB", "name": "Барбадос", "nameEn": "Barbados", "nameKa": "Barbados", "dial": "+1246", "flag": "🇧🇧", "mask": "### ###-####", "priority": 999}, {"code": "BZ", "name": "Белиз", "nameEn": "Belize", "nameKa": "Belize", "dial": "+501", "flag": "🇧🇿", "mask": "### ###-####", "priority": 999}, {"code": "BJ", "name": "Бенин", "nameEn": "Benin", "nameKa": "Benin", "dial": "+229", "flag": "🇧🇯", "mask": "### ###-####", "priority": 999}, {"code": "BM", "name": "Бермудские Острова", "nameEn": "Bermuda", "nameKa": "Bermuda", "dial": "+1441", "flag": "🇧🇲", "mask": "### ###-####", "priority": 999}, {"code": "BO", "name": "Боливия", "nameEn": "Bolivia", "nameKa": "Bolivia", "dial": "+591", "flag": "🇧🇴", "mask": "### ###-####", "priority": 999}, {"code": "BW", "name": "Ботсвана", "nameEn": "Botswana", "nameKa": "Botswana", "dial": "+267", "flag": "🇧🇼", "mask": "### ###-####", "priority": 999}, {"code": "IO", "name": "Британская территория в Индийском океане", "nameEn": "British Indian Ocean Territory", "nameKa": "British Indian Ocean Territory", "dial": "+246", "flag": "🇮🇴", "mask": "### ###-####", "priority": 999}, {"code": "VG", "name": "Британские Виргинские острова", "nameEn": "British Virgin Islands", "nameKa": "British Virgin Islands", "dial": "+1284", "flag": "🇻🇬", "mask": "### ###-####", "priority": 999}, {"code": "BN", "name": "Бруней", "nameEn": "Brunei", "nameKa": "Brunei", "dial": "+673", "flag": "🇧🇳", "mask": "### ###-####", "priority": 999}, {"code": "BF", "name": "Буркина-Фасо", "nameEn": "Burkina Faso", "nameKa": "Burkina Faso", "dial": "+226", "flag": "🇧🇫", "mask": "### ###-####", "priority": 999}, {"code": "BI", "name": "Бурунди", "nameEn": "Burundi", "nameKa": "Burundi", "dial": "+257", "flag": "🇧🇮", "mask": "### ###-####", "priority": 999}, {"code": "BT", "name": "Бутан", "nameEn": "Bhutan", "nameKa": "Bhutan", "dial": "+975", "flag": "🇧🇹", "mask": "### ###-####", "priority": 999}, {"code": "VU", "name": "Вануату", "nameEn": "Vanuatu", "nameKa": "Vanuatu", "dial": "+678", "flag": "🇻🇺", "mask": "### ###-####", "priority": 999}, {"code": "VA", "name": "Ватикан", "nameEn": "Vatican City", "nameKa": "Vatican City", "dial": "+3", "flag": "🇻🇦", "mask": "### ###-####", "priority": 999}, {"code": "VE", "name": "Венесуэла", "nameEn": "Venezuela", "nameKa": "Venezuela", "dial": "+58", "flag": "🇻🇪", "mask": "### ###-####", "priority": 999}, {"code": "VI", "name": "Виргинские Острова", "nameEn": "United States Virgin Islands", "nameKa": "United States Virgin Islands", "dial": "+1340", "flag": "🇻🇮", "mask": "### ###-####", "priority": 999}, {"code": "UM", "name": "Внешние малые острова США", "nameEn": "United States Minor Outlying Islands", "nameKa": "United States Minor Outlying Islands", "dial": "+268", "flag": "🇺🇲", "mask": "### ###-####", "priority": 999}, {"code": "TL", "name": "Восточный Тимор", "nameEn": "Timor-Leste", "nameKa": "Timor-Leste", "dial": "+670", "flag": "🇹🇱", "mask": "### ###-####", "priority": 999}, {"code": "GA", "name": "Габон", "nameEn": "Gabon", "nameKa": "Gabon", "dial": "+241", "flag": "🇬🇦", "mask": "### ###-####", "priority": 999}, {"code": "HT", "name": "Гаити", "nameEn": "Haiti", "nameKa": "Haiti", "dial": "+509", "flag": "🇭🇹", "mask": "### ###-####", "priority": 999}, {"code": "GY", "name": "Гайана", "nameEn": "Guyana", "nameKa": "Guyana", "dial": "+592", "flag": "🇬🇾", "mask": "### ###-####", "priority": 999}, {"code": "GM", "name": "Гамбия", "nameEn": "Gambia", "nameKa": "Gambia", "dial": "+220", "flag": "🇬🇲", "mask": "### ###-####", "priority": 999}, {"code": "GH", "name": "Гана", "nameEn": "Ghana", "nameKa": "Ghana", "dial": "+233", "flag": "🇬🇭", "mask": "### ###-####", "priority": 999}, {"code": "GP", "name": "Гваделупа", "nameEn": "Guadeloupe", "nameKa": "Guadeloupe", "dial": "+590", "flag": "🇬🇵", "mask": "### ###-####", "priority": 999}, {"code": "GT", "name": "Гватемала", "nameEn": "Guatemala", "nameKa": "Guatemala", "dial": "+502", "flag": "🇬🇹", "mask": "### ###-####", "priority": 999}, {"code": "GN", "name": "Гвинея", "nameEn": "Guinea", "nameKa": "Guinea", "dial": "+224", "flag": "🇬🇳", "mask": "### ###-####", "priority": 999}, {"code": "GW", "name": "Гвинея-Бисау", "nameEn": "Guinea-Bissau", "nameKa": "Guinea-Bissau", "dial": "+245", "flag": "🇬🇼", "mask": "### ###-####", "priority": 999}, {"code": "GG", "name": "Гернси", "nameEn": "Guernsey", "nameKa": "Guernsey", "dial": "+44", "flag": "🇬🇬", "mask": "### ###-####", "priority": 999}, {"code": "GI", "name": "Гибралтар", "nameEn": "Gibraltar", "nameKa": "Gibraltar", "dial": "+350", "flag": "🇬🇮", "mask": "### ###-####", "priority": 999}, {"code": "HN", "name": "Гондурас", "nameEn": "Honduras", "nameKa": "Honduras", "dial": "+504", "flag": "🇭🇳", "mask": "### ###-####", "priority": 999}, {"code": "HK", "name": "Гонконг", "nameEn": "Hong Kong", "nameKa": "Hong Kong", "dial": "+852", "flag": "🇭🇰", "mask": "### ###-####", "priority": 999}, {"code": "GD", "name": "Гренада", "nameEn": "Grenada", "nameKa": "Grenada", "dial": "+1473", "flag": "🇬🇩", "mask": "### ###-####", "priority": 999}, {"code": "GL", "name": "Гренландия", "nameEn": "Greenland", "nameKa": "Greenland", "dial": "+299", "flag": "🇬🇱", "mask": "### ###-####", "priority": 999}, {"code": "GU", "name": "Гуам", "nameEn": "Guam", "nameKa": "Guam", "dial": "+1671", "flag": "🇬🇺", "mask": "### ###-####", "priority": 999}, {"code": "CD", "name": "Демократическая Республика Конго", "nameEn": "DR Congo", "nameKa": "DR Congo", "dial": "+243", "flag": "🇨🇩", "mask": "### ###-####", "priority": 999}, {"code": "JE", "name": "Джерси", "nameEn": "Jersey", "nameKa": "Jersey", "dial": "+44", "flag": "🇯🇪", "mask": "### ###-####", "priority": 999}, {"code": "DJ", "name": "Джибути", "nameEn": "Djibouti", "nameKa": "Djibouti", "dial": "+253", "flag": "🇩🇯", "mask": "### ###-####", "priority": 999}, {"code": "DM", "name": "Доминика", "nameEn": "Dominica", "nameKa": "Dominica", "dial": "+1767", "flag": "🇩🇲", "mask": "### ###-####", "priority": 999}, {"code": "DO", "name": "Доминиканская Республика", "nameEn": "Dominican Republic", "nameKa": "Dominican Republic", "dial": "+1", "flag": "🇩🇴", "mask": "### ###-####", "priority": 999}, {"code": "ZM", "name": "Замбия", "nameEn": "Zambia", "nameKa": "Zambia", "dial": "+260", "flag": "🇿🇲", "mask": "### ###-####", "priority": 999}, {"code": "EH", "name": "Западная Сахара", "nameEn": "Western Sahara", "nameKa": "Western Sahara", "dial": "+2", "flag": "🇪🇭", "mask": "### ###-####", "priority": 999}, {"code": "ZW", "name": "Зимбабве", "nameEn": "Zimbabwe", "nameKa": "Zimbabwe", "dial": "+263", "flag": "🇿🇼", "mask": "### ###-####", "priority": 999}, {"code": "YE", "name": "Йемен", "nameEn": "Yemen", "nameKa": "Yemen", "dial": "+967", "flag": "🇾🇪", "mask": "### ###-####", "priority": 999}, {"code": "CV", "name": "Кабо-Верде", "nameEn": "Cape Verde", "nameKa": "Cape Verde", "dial": "+238", "flag": "🇨🇻", "mask": "### ###-####", "priority": 999}, {"code": "KY", "name": "Каймановы острова", "nameEn": "Cayman Islands", "nameKa": "Cayman Islands", "dial": "+1345", "flag": "🇰🇾", "mask": "### ###-####", "priority": 999}, {"code": "KH", "name": "Камбоджа", "nameEn": "Cambodia", "nameKa": "Cambodia", "dial": "+855", "flag": "🇰🇭", "mask": "### ###-####", "priority": 999}, {"code": "CM", "name": "Камерун", "nameEn": "Cameroon", "nameKa": "Cameroon", "dial": "+237", "flag": "🇨🇲", "mask": "### ###-####", "priority": 999}, {"code": "BQ", "name": "Карибские Нидерланды", "nameEn": "Caribbean Netherlands", "nameKa": "Caribbean Netherlands", "dial": "+599", "flag": "", "mask": "### ###-####", "priority": 999}, {"code": "KE", "name": "Кения", "nameEn": "Kenya", "nameKa": "Kenya", "dial": "+254", "flag": "🇰🇪", "mask": "### ###-####", "priority": 999}, {"code": "KI", "name": "Кирибати", "nameEn": "Kiribati", "nameKa": "Kiribati", "dial": "+686", "flag": "🇰🇮", "mask": "### ###-####", "priority": 999}, {"code": "CC", "name": "Кокосовые острова", "nameEn": "Cocos (Keeling) Islands", "nameKa": "Cocos (Keeling) Islands", "dial": "+61", "flag": "🇨🇨", "mask": "### ###-####", "priority": 999}, {"code": "KM", "name": "Коморы", "nameEn": "Comoros", "nameKa": "Comoros", "dial": "+269", "flag": "🇰🇲", "mask": "### ###-####", "priority": 999}, {"code": "CR", "name": "Коста-Рика", "nameEn": "Costa Rica", "nameKa": "Costa Rica", "dial": "+506", "flag": "🇨🇷", "mask": "### ###-####", "priority": 999}, {"code": "CI", "name": "Кот-д’Ивуар", "nameEn": "Ivory Coast", "nameKa": "Ivory Coast", "dial": "+225", "flag": "🇨🇮", "mask": "### ###-####", "priority": 999}, {"code": "CU", "name": "Куба", "nameEn": "Cuba", "nameKa": "Cuba", "dial": "+53", "flag": "🇨🇺", "mask": "### ###-####", "priority": 999}, {"code": "CW", "name": "Кюрасао", "nameEn": "Curaçao", "nameKa": "Curaçao", "dial": "+599", "flag": "🇨🇼", "mask": "### ###-####", "priority": 999}, {"code": "LA", "name": "Лаос", "nameEn": "Laos", "nameKa": "Laos", "dial": "+856", "flag": "🇱🇦", "mask": "### ###-####", "priority": 999}, {"code": "LS", "name": "Лесото", "nameEn": "Lesotho", "nameKa": "Lesotho", "dial": "+266", "flag": "🇱🇸", "mask": "### ###-####", "priority": 999}, {"code": "LR", "name": "Либерия", "nameEn": "Liberia", "nameKa": "Liberia", "dial": "+231", "flag": "🇱🇷", "mask": "### ###-####", "priority": 999}, {"code": "LY", "name": "Ливия", "nameEn": "Libya", "nameKa": "Libya", "dial": "+218", "flag": "🇱🇾", "mask": "### ###-####", "priority": 999}, {"code": "LI", "name": "Лихтенштейн", "nameEn": "Liechtenstein", "nameKa": "Liechtenstein", "dial": "+423", "flag": "🇱🇮", "mask": "### ###-####", "priority": 999}, {"code": "MU", "name": "Маврикий", "nameEn": "Mauritius", "nameKa": "Mauritius", "dial": "+230", "flag": "🇲🇺", "mask": "### ###-####", "priority": 999}, {"code": "MR", "name": "Мавритания", "nameEn": "Mauritania", "nameKa": "Mauritania", "dial": "+222", "flag": "🇲🇷", "mask": "### ###-####", "priority": 999}, {"code": "MG", "name": "Мадагаскар", "nameEn": "Madagascar", "nameKa": "Madagascar", "dial": "+261", "flag": "🇲🇬", "mask": "### ###-####", "priority": 999}, {"code": "YT", "name": "Майотта", "nameEn": "Mayotte", "nameKa": "Mayotte", "dial": "+262", "flag": "🇾🇹", "mask": "### ###-####", "priority": 999}, {"code": "MO", "name": "Макао", "nameEn": "Macau", "nameKa": "Macau", "dial": "+853", "flag": "🇲🇴", "mask": "### ###-####", "priority": 999}, {"code": "MW", "name": "Малави", "nameEn": "Malawi", "nameKa": "Malawi", "dial": "+265", "flag": "🇲🇼", "mask": "### ###-####", "priority": 999}, {"code": "ML", "name": "Мали", "nameEn": "Mali", "nameKa": "Mali", "dial": "+223", "flag": "🇲🇱", "mask": "### ###-####", "priority": 999}, {"code": "MV", "name": "Мальдивы", "nameEn": "Maldives", "nameKa": "Maldives", "dial": "+960", "flag": "🇲🇻", "mask": "### ###-####", "priority": 999}, {"code": "MA", "name": "Марокко", "nameEn": "Morocco", "nameKa": "Morocco", "dial": "+212", "flag": "🇲🇦", "mask": "### ###-####", "priority": 999}, {"code": "MQ", "name": "Мартиника", "nameEn": "Martinique", "nameKa": "Martinique", "dial": "+596", "flag": "🇲🇶", "mask": "### ###-####", "priority": 999}, {"code": "MH", "name": "Маршалловы Острова", "nameEn": "Marshall Islands", "nameKa": "Marshall Islands", "dial": "+692", "flag": "🇲🇭", "mask": "### ###-####", "priority": 999}, {"code": "MZ", "name": "Мозамбик", "nameEn": "Mozambique", "nameKa": "Mozambique", "dial": "+258", "flag": "🇲🇿", "mask": "### ###-####", "priority": 999}, {"code": "MC", "name": "Монако", "nameEn": "Monaco", "nameKa": "Monaco", "dial": "+377", "flag": "🇲🇨", "mask": "### ###-####", "priority": 999}, {"code": "MN", "name": "Монголия", "nameEn": "Mongolia", "nameKa": "Mongolia", "dial": "+976", "flag": "🇲🇳", "mask": "### ###-####", "priority": 999}, {"code": "MS", "name": "Монтсеррат", "nameEn": "Montserrat", "nameKa": "Montserrat", "dial": "+1664", "flag": "🇲🇸", "mask": "### ###-####", "priority": 999}, {"code": "MM", "name": "Мьянма", "nameEn": "Myanmar", "nameKa": "Myanmar", "dial": "+95", "flag": "🇲🇲", "mask": "### ###-####", "priority": 999}, {"code": "NA", "name": "Намибия", "nameEn": "Namibia", "nameKa": "Namibia", "dial": "+264", "flag": "🇳🇦", "mask": "### ###-####", "priority": 999}, {"code": "NR", "name": "Науру", "nameEn": "Nauru", "nameKa": "Nauru", "dial": "+674", "flag": "🇳🇷", "mask": "### ###-####", "priority": 999}, {"code": "NP", "name": "Непал", "nameEn": "Nepal", "nameKa": "Nepal", "dial": "+977", "flag": "🇳🇵", "mask": "### ###-####", "priority": 999}, {"code": "NE", "name": "Нигер", "nameEn": "Niger", "nameKa": "Niger", "dial": "+227", "flag": "🇳🇪", "mask": "### ###-####", "priority": 999}, {"code": "NG", "name": "Нигерия", "nameEn": "Nigeria", "nameKa": "Nigeria", "dial": "+234", "flag": "🇳🇬", "mask": "### ###-####", "priority": 999}, {"code": "NI", "name": "Никарагуа", "nameEn": "Nicaragua", "nameKa": "Nicaragua", "dial": "+505", "flag": "🇳🇮", "mask": "### ###-####", "priority": 999}, {"code": "NU", "name": "Ниуэ", "nameEn": "Niue", "nameKa": "Niue", "dial": "+683", "flag": "🇳🇺", "mask": "### ###-####", "priority": 999}, {"code": "NC", "name": "Новая Каледония", "nameEn": "New Caledonia", "nameKa": "New Caledonia", "dial": "+687", "flag": "🇳🇨", "mask": "### ###-####", "priority": 999}, {"code": "NF", "name": "Норфолк", "nameEn": "Norfolk Island", "nameKa": "Norfolk Island", "dial": "+672", "flag": "🇳🇫", "mask": "### ###-####", "priority": 999}, {"code": "BV", "name": "Остров Буве", "nameEn": "Bouvet Island", "nameKa": "Bouvet Island", "dial": "+47", "flag": "🇧🇻", "mask": "### ###-####", "priority": 999}, {"code": "IM", "name": "Остров Мэн", "nameEn": "Isle of Man", "nameKa": "Isle of Man", "dial": "+44", "flag": "🇮🇲", "mask": "### ###-####", "priority": 999}, {"code": "CX", "name": "Остров Рождества", "nameEn": "Christmas Island", "nameKa": "Christmas Island", "dial": "+61", "flag": "🇨🇽", "mask": "### ###-####", "priority": 999}, {"code": "CK", "name": "Острова Кука", "nameEn": "Cook Islands", "nameKa": "Cook Islands", "dial": "+682", "flag": "🇨🇰", "mask": "### ###-####", "priority": 999}, {"code": "PN", "name": "Острова Питкэрн", "nameEn": "Pitcairn Islands", "nameKa": "Pitcairn Islands", "dial": "+64", "flag": "🇵🇳", "mask": "### ###-####", "priority": 999}, {"code": "SH", "name": "Острова Святой Елены, Вознесения и Тристан-да-Кунья", "nameEn": "Saint Helena, Ascension and Tristan da Cunha", "nameKa": "Saint Helena, Ascension and Tristan da Cunha", "dial": "+2", "flag": "🇸🇭", "mask": "### ###-####", "priority": 999}, {"code": "PK", "name": "Пакистан", "nameEn": "Pakistan", "nameKa": "Pakistan", "dial": "+92", "flag": "🇵🇰", "mask": "### ###-####", "priority": 999}, {"code": "PW", "name": "Палау", "nameEn": "Palau", "nameKa": "Palau", "dial": "+680", "flag": "🇵🇼", "mask": "### ###-####", "priority": 999}, {"code": "PS", "name": "Палестина", "nameEn": "Palestine", "nameKa": "Palestine", "dial": "+970", "flag": "🇵🇸", "mask": "### ###-####", "priority": 999}, {"code": "PA", "name": "Панама", "nameEn": "Panama", "nameKa": "Panama", "dial": "+507", "flag": "🇵🇦", "mask": "### ###-####", "priority": 999}, {"code": "PG", "name": "Папуа — Новая Гвинея", "nameEn": "Papua New Guinea", "nameKa": "Papua New Guinea", "dial": "+675", "flag": "🇵🇬", "mask": "### ###-####", "priority": 999}, {"code": "PY", "name": "Парагвай", "nameEn": "Paraguay", "nameKa": "Paraguay", "dial": "+595", "flag": "🇵🇾", "mask": "### ###-####", "priority": 999}, {"code": "PE", "name": "Перу", "nameEn": "Peru", "nameKa": "Peru", "dial": "+51", "flag": "🇵🇪", "mask": "### ###-####", "priority": 999}, {"code": "PR", "name": "Пуэрто-Рико", "nameEn": "Puerto Rico", "nameKa": "Puerto Rico", "dial": "+1", "flag": "🇵🇷", "mask": "### ###-####", "priority": 999}, {"code": "CG", "name": "Республика Конго", "nameEn": "Congo", "nameKa": "Congo", "dial": "+242", "flag": "🇨🇬", "mask": "### ###-####", "priority": 999}, {"code": "XK", "name": "Республика Косово", "nameEn": "Kosovo", "nameKa": "Kosovo", "dial": "+383", "flag": "🇽🇰", "mask": "### ###-####", "priority": 999}, {"code": "RE", "name": "Реюньон", "nameEn": "Réunion", "nameKa": "Réunion", "dial": "+262", "flag": "🇷🇪", "mask": "### ###-####", "priority": 999}, {"code": "RW", "name": "Руанда", "nameEn": "Rwanda", "nameKa": "Rwanda", "dial": "+250", "flag": "🇷🇼", "mask": "### ###-####", "priority": 999}, {"code": "SV", "name": "Сальвадор", "nameEn": "El Salvador", "nameKa": "El Salvador", "dial": "+503", "flag": "🇸🇻", "mask": "### ###-####", "priority": 999}, {"code": "WS", "name": "Самоа", "nameEn": "Samoa", "nameKa": "Samoa", "dial": "+685", "flag": "🇼🇸", "mask": "### ###-####", "priority": 999}, {"code": "SM", "name": "Сан-Марино", "nameEn": "San Marino", "nameKa": "San Marino", "dial": "+378", "flag": "🇸🇲", "mask": "### ###-####", "priority": 999}, {"code": "ST", "name": "Сан-Томе и Принсипи", "nameEn": "São Tomé and Príncipe", "nameKa": "São Tomé and Príncipe", "dial": "+239", "flag": "🇸🇹", "mask": "### ###-####", "priority": 999}, {"code": "SZ", "name": "Свазиленд", "nameEn": "Eswatini", "nameKa": "Eswatini", "dial": "+268", "flag": "🇸🇿", "mask": "### ###-####", "priority": 999}, {"code": "KP", "name": "Северная Корея", "nameEn": "North Korea", "nameKa": "North Korea", "dial": "+850", "flag": "🇰🇵", "mask": "### ###-####", "priority": 999}, {"code": "MP", "name": "Северные Марианские острова", "nameEn": "Northern Mariana Islands", "nameKa": "Northern Mariana Islands", "dial": "+1670", "flag": "🇲🇵", "mask": "### ###-####", "priority": 999}, {"code": "SC", "name": "Сейшельские Острова", "nameEn": "Seychelles", "nameKa": "Seychelles", "dial": "+248", "flag": "🇸🇨", "mask": "### ###-####", "priority": 999}, {"code": "BL", "name": "Сен-Бартелеми", "nameEn": "Saint Barthélemy", "nameKa": "Saint Barthélemy", "dial": "+590", "flag": "🇧🇱", "mask": "### ###-####", "priority": 999}, {"code": "MF", "name": "Сен-Мартен", "nameEn": "Saint Martin", "nameKa": "Saint Martin", "dial": "+590", "flag": "🇲🇫", "mask": "### ###-####", "priority": 999}, {"code": "PM", "name": "Сен-Пьер и Микелон", "nameEn": "Saint Pierre and Miquelon", "nameKa": "Saint Pierre and Miquelon", "dial": "+508", "flag": "🇵🇲", "mask": "### ###-####", "priority": 999}, {"code": "SN", "name": "Сенегал", "nameEn": "Senegal", "nameKa": "Senegal", "dial": "+221", "flag": "🇸🇳", "mask": "### ###-####", "priority": 999}, {"code": "VC", "name": "Сент-Винсент и Гренадины", "nameEn": "Saint Vincent and the Grenadines", "nameKa": "Saint Vincent and the Grenadines", "dial": "+1784", "flag": "🇻🇨", "mask": "### ###-####", "priority": 999}, {"code": "KN", "name": "Сент-Китс и Невис", "nameEn": "Saint Kitts and Nevis", "nameKa": "Saint Kitts and Nevis", "dial": "+1869", "flag": "🇰🇳", "mask": "### ###-####", "priority": 999}, {"code": "LC", "name": "Сент-Люсия", "nameEn": "Saint Lucia", "nameKa": "Saint Lucia", "dial": "+1758", "flag": "🇱🇨", "mask": "### ###-####", "priority": 999}, {"code": "SX", "name": "Синт-Мартен", "nameEn": "Sint Maarten", "nameKa": "Sint Maarten", "dial": "+1721", "flag": "🇸🇽", "mask": "### ###-####", "priority": 999}, {"code": "SY", "name": "Сирия", "nameEn": "Syria", "nameKa": "Syria", "dial": "+963", "flag": "🇸🇾", "mask": "### ###-####", "priority": 999}, {"code": "SB", "name": "Соломоновы Острова", "nameEn": "Solomon Islands", "nameKa": "Solomon Islands", "dial": "+677", "flag": "🇸🇧", "mask": "### ###-####", "priority": 999}, {"code": "SO", "name": "Сомали", "nameEn": "Somalia", "nameKa": "Somalia", "dial": "+252", "flag": "🇸🇴", "mask": "### ###-####", "priority": 999}, {"code": "SD", "name": "Судан", "nameEn": "Sudan", "nameKa": "Sudan", "dial": "+249", "flag": "🇸🇩", "mask": "### ###-####", "priority": 999}, {"code": "SR", "name": "Суринам", "nameEn": "Suriname", "nameKa": "Suriname", "dial": "+597", "flag": "🇸🇷", "mask": "### ###-####", "priority": 999}, {"code": "SL", "name": "Сьерра-Леоне", "nameEn": "Sierra Leone", "nameKa": "Sierra Leone", "dial": "+232", "flag": "🇸🇱", "mask": "### ###-####", "priority": 999}, {"code": "TW", "name": "Тайвань", "nameEn": "Taiwan", "nameKa": "Taiwan", "dial": "+886", "flag": "🇹🇼", "mask": "### ###-####", "priority": 999}, {"code": "TZ", "name": "Танзания", "nameEn": "Tanzania", "nameKa": "Tanzania", "dial": "+255", "flag": "🇹🇿", "mask": "### ###-####", "priority": 999}, {"code": "TC", "name": "Теркс и Кайкос", "nameEn": "Turks and Caicos Islands", "nameKa": "Turks and Caicos Islands", "dial": "+1649", "flag": "🇹🇨", "mask": "### ###-####", "priority": 999}, {"code": "TG", "name": "Того", "nameEn": "Togo", "nameKa": "Togo", "dial": "+228", "flag": "🇹🇬", "mask": "### ###-####", "priority": 999}, {"code": "TK", "name": "Токелау", "nameEn": "Tokelau", "nameKa": "Tokelau", "dial": "+690", "flag": "🇹🇰", "mask": "### ###-####", "priority": 999}, {"code": "TO", "name": "Тонга", "nameEn": "Tonga", "nameKa": "Tonga", "dial": "+676", "flag": "🇹🇴", "mask": "### ###-####", "priority": 999}, {"code": "TT", "name": "Тринидад и Тобаго", "nameEn": "Trinidad and Tobago", "nameKa": "Trinidad and Tobago", "dial": "+1868", "flag": "🇹🇹", "mask": "### ###-####", "priority": 999}, {"code": "TV", "name": "Тувалу", "nameEn": "Tuvalu", "nameKa": "Tuvalu", "dial": "+688", "flag": "🇹🇻", "mask": "### ###-####", "priority": 999}, {"code": "TN", "name": "Тунис", "nameEn": "Tunisia", "nameKa": "Tunisia", "dial": "+216", "flag": "🇹🇳", "mask": "### ###-####", "priority": 999}, {"code": "UG", "name": "Уганда", "nameEn": "Uganda", "nameKa": "Uganda", "dial": "+256", "flag": "🇺🇬", "mask": "### ###-####", "priority": 999}, {"code": "WF", "name": "Уоллис и Футуна", "nameEn": "Wallis and Futuna", "nameKa": "Wallis and Futuna", "dial": "+681", "flag": "🇼🇫", "mask": "### ###-####", "priority": 999}, {"code": "UY", "name": "Уругвай", "nameEn": "Uruguay", "nameKa": "Uruguay", "dial": "+598", "flag": "🇺🇾", "mask": "### ###-####", "priority": 999}, {"code": "FO", "name": "Фарерские острова", "nameEn": "Faroe Islands", "nameKa": "Faroe Islands", "dial": "+298", "flag": "🇫🇴", "mask": "### ###-####", "priority": 999}, {"code": "FM", "name": "Федеративные Штаты Микронезии", "nameEn": "Micronesia", "nameKa": "Micronesia", "dial": "+691", "flag": "🇫🇲", "mask": "### ###-####", "priority": 999}, {"code": "FJ", "name": "Фиджи", "nameEn": "Fiji", "nameKa": "Fiji", "dial": "+679", "flag": "🇫🇯", "mask": "### ###-####", "priority": 999}, {"code": "FK", "name": "Фолклендские острова", "nameEn": "Falkland Islands", "nameKa": "Falkland Islands", "dial": "+500", "flag": "🇫🇰", "mask": "### ###-####", "priority": 999}, {"code": "GF", "name": "Французская Гвиана", "nameEn": "French Guiana", "nameKa": "French Guiana", "dial": "+594", "flag": "🇬🇫", "mask": "### ###-####", "priority": 999}, {"code": "PF", "name": "Французская Полинезия", "nameEn": "French Polynesia", "nameKa": "French Polynesia", "dial": "+689", "flag": "🇵🇫", "mask": "### ###-####", "priority": 999}, {"code": "TF", "name": "Французские Южные и Антарктические территории", "nameEn": "French Southern and Antarctic Lands", "nameKa": "French Southern and Antarctic Lands", "dial": "+262", "flag": "🇹🇫", "mask": "### ###-####", "priority": 999}, {"code": "CF", "name": "Центральноафриканская Республика", "nameEn": "Central African Republic", "nameKa": "Central African Republic", "dial": "+236", "flag": "🇨🇫", "mask": "### ###-####", "priority": 999}, {"code": "TD", "name": "Чад", "nameEn": "Chad", "nameKa": "Chad", "dial": "+235", "flag": "🇹🇩", "mask": "### ###-####", "priority": 999}, {"code": "SJ", "name": "Шпицберген и Ян-Майен", "nameEn": "Svalbard and Jan Mayen", "nameKa": "Svalbard and Jan Mayen", "dial": "+4779", "flag": "🇸🇯", "mask": "### ###-####", "priority": 999}, {"code": "LK", "name": "Шри-Ланка", "nameEn": "Sri Lanka", "nameKa": "Sri Lanka", "dial": "+94", "flag": "🇱🇰", "mask": "### ###-####", "priority": 999}, {"code": "EC", "name": "Эквадор", "nameEn": "Ecuador", "nameKa": "Ecuador", "dial": "+593", "flag": "🇪🇨", "mask": "### ###-####", "priority": 999}, {"code": "GQ", "name": "Экваториальная Гвинея", "nameEn": "Equatorial Guinea", "nameKa": "Equatorial Guinea", "dial": "+240", "flag": "🇬🇶", "mask": "### ###-####", "priority": 999}, {"code": "ER", "name": "Эритрея", "nameEn": "Eritrea", "nameKa": "Eritrea", "dial": "+291", "flag": "🇪🇷", "mask": "### ###-####", "priority": 999}, {"code": "ET", "name": "Эфиопия", "nameEn": "Ethiopia", "nameKa": "Ethiopia", "dial": "+251", "flag": "🇪🇹", "mask": "### ###-####", "priority": 999}, {"code": "GS", "name": "Южная Георгия и Южные Сандвичевы острова", "nameEn": "South Georgia", "nameKa": "South Georgia", "dial": "+500", "flag": "🇬🇸", "mask": "### ###-####", "priority": 999}, {"code": "SS", "name": "Южный Судан", "nameEn": "South Sudan", "nameKa": "South Sudan", "dial": "+211", "flag": "🇸🇸", "mask": "### ###-####", "priority": 999}, {"code": "JM", "name": "Ямайка", "nameEn": "Jamaica", "nameKa": "Jamaica", "dial": "+1876", "flag": "🇯🇲", "mask": "### ###-####", "priority": 999}];

  // Pre-sort countries by dial length descending for prefix matching
  var COUNTRIES_BY_DIAL_LEN = COUNTRIES.slice().sort(function (a, b) {
    return b.dial.length - a.dial.length;
  });

  // Top popular quick-select countries
  var POPULAR_CODES = ['GE', 'RU', 'IL', 'TR', 'KZ', 'UA', 'AM', 'AZ', 'BY', 'US', 'DE', 'AE'];

  // Preload top priority flags immediately for 0ms instant display
  function preloadPriorityFlags() {
    POPULAR_CODES.forEach(function (code) {
      var img = new Image();
      img.src = 'https://flagcdn.com/w40/' + code.toLowerCase() + '.png';
    });
  }
  preloadPriorityFlags();

  var I18N = {
    ru: {
      title_phone: "Подтверждение номера",
      sub_phone: "Введите номер для получения проверочного SMS",
      title_otp: "Код из SMS",
      sub_otp: "Мы отправили 6-значный проверочный код на номер",
      btn_send: "Получить код",
      btn_verify: "Подтвердить",
      resend_timer: "Повторная отправка через",
      resend_action: "Отправить код повторно",
      change_number: "Изменить номер",
      success_title: "Номер подтверждён",
      success_sub: "Телефон успешно сохранён и верифицирован",
      search_placeholder: "Поиск страны или кода (+995, Грузия)...",
      popular_title: "Популярные",
      all_countries_title: "Все страны",
      err_invalid_phone: "Введите корректный номер телефона",
      err_invalid_code: "Неверный проверочный код. Проверьте SMS.",
      err_expired: "Срок действия кода истёк. Запросите новый код.",
      err_too_many: "Слишком много попыток. Подождите 1 минуту.",
      err_network: "Ошибка сети. Проверьте интернет-соединение.",
      err_region_disabled: "Отправка SMS для этого региона отключена в Firebase.",
      err_generic: "Не удалось отправить SMS. Попробуйте ещё раз через минуту."
    },
    ka: {
      title_phone: "ნომრის დადასტურება",
      sub_phone: "შეიყვანეთ ტელეფონის ნომერი SMS კოდის მისაღებად",
      title_otp: "SMS კოდი",
      sub_otp: "ჩვენ გამოგიგზავნეთ 6-ნიშნა კოდი ნომერზე",
      btn_send: "კოდის მიღება",
      btn_verify: "დადასტურება",
      resend_timer: "ხელახლა გაგზავნა",
      resend_action: "კოდის ხელახლა გაგზავნა",
      change_number: "ნომრის შეცვლა",
      success_title: "ნომერი დადასტურებულია",
      success_sub: "ტელეფონი წარმატებით დადასტურდა",
      search_placeholder: "ქვეყნის ან კოდის ძებნა...",
      popular_title: "პოპულარული",
      all_countries_title: "ყველა ქვეყანა",
      err_invalid_phone: "შეიყვანეთ სწორი ტელეფონის ნომერი",
      err_invalid_code: "არასწორი კოდი. სცადეთ ხელახლა.",
      err_expired: "კოდის ვადა ამოიწურა. მოითხოვეთ ახალი.",
      err_too_many: "ძალიან ბევრი მცდელობა. მოიცადეთ 1 წუთი.",
      err_network: "ქსელის შეცდომა. შეამოწმეთ ინტერნეტი.",
      err_region_disabled: "SMS გაგზავნა გამორთულია ამ რეგიონისთვის Firebase-ში.",
      err_generic: "SMS-ის გაგზავნა ვერ მოხერხდა. სცადეთ მოგვიანებით."
    },
    en: {
      title_phone: "Phone Verification",
      sub_phone: "Enter your phone number to receive a verification SMS",
      title_otp: "SMS Code",
      sub_otp: "We sent a 6-digit verification code to",
      btn_send: "Get Code",
      btn_verify: "Verify",
      resend_timer: "Resend code in",
      resend_action: "Resend code",
      change_number: "Change number",
      success_title: "Phone Verified",
      success_sub: "Your phone number has been successfully verified",
      search_placeholder: "Search country or dial code (+995, Georgia)...",
      popular_title: "Popular",
      all_countries_title: "All Countries",
      err_invalid_phone: "Please enter a valid phone number",
      err_invalid_code: "Invalid code. Please check SMS and retry.",
      err_expired: "Code expired. Please request a new one.",
      err_too_many: "Too many attempts. Please wait 1 minute.",
      err_network: "Network error. Please check your internet connection.",
      err_region_disabled: "SMS to this region is disabled in Firebase.",
      err_generic: "Failed to send SMS. Please try again later."
    }
  };

  function getLang() {
    var lang = document.documentElement.lang || localStorage.getItem('app_language') || 'ru';
    if (lang.indexOf('ka') === 0) return 'ka';
    if (lang.indexOf('en') === 0) return 'en';
    return 'ru';
  }

  function t(key) {
    var l = getLang();
    return (I18N[l] && I18N[l][key]) || (I18N['ru'] && I18N['ru'][key]) || key;
  }

  function getCountryName(c) {
    var l = getLang();
    if (l === 'ka' && c.nameKa) return c.nameKa;
    if (l === 'en' && c.nameEn) return c.nameEn;
    return c.name || c.nameEn || c.code;
  }

  function renderFlagHTML(c, className) {
    className = className || 'mesti-flag-img';
    var lower = c.code.toLowerCase();
    var fallback = c.flag || '🌐';
    return '<span class="mesti-flag-wrap">' +
      '<img src="https://flagcdn.com/w40/' + lower + '.png" srcset="https://flagcdn.com/w80/' + lower + '.png 2x" ' +
      'class="' + className + '" width="22" height="16" alt="' + c.code + '" loading="eager" ' +
      'onerror="this.style.display=\'none\';var fb=this.nextElementSibling;if(fb)fb.style.display=\'inline\';" />' +
      '<span class="mesti-flag-emoji-fallback" style="display:none;">' + fallback + '</span>' +
      '</span>';
  }

  // State
  var selectedCountry = COUNTRIES[0]; // GE by default
  var confirmationResult = null;
  var currentFullNumber = "";
  var timerInterval = null;
  var currentPromise = null;
  var isFirebaseInitialized = false;

  function initFirebase() {
    if (isFirebaseInitialized) return;
    if (typeof window.firebase === 'undefined') {
      console.warn('[MestiPhoneAuth] Firebase SDK not loaded');
      return;
    }
    if (!window.firebase.apps || !window.firebase.apps.length) {
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    isFirebaseInitialized = true;
  }

  /**
   * Smart country auto-detection by dial prefix or input string
   */
  function parseAndDetectCountry(inputStr, currentCountry) {
    var s = String(inputStr || "").trim();
    if (!s) return { country: currentCountry || COUNTRIES[0], digits: "", detected: false };

    // 1. If starts with +, match longest matching dial code
    if (s.charAt(0) === '+') {
      var withoutPlus = s.substring(1);
      for (var i = 0; i < COUNTRIES_BY_DIAL_LEN.length; i++) {
        var c = COUNTRIES_BY_DIAL_LEN[i];
        var cDialWithoutPlus = c.dial.substring(1);
        if (withoutPlus.indexOf(cDialWithoutPlus) === 0) {
          var national = withoutPlus.substring(cDialWithoutPlus.length).replace(/\D/g, '');
          return { country: c, digits: national, detected: true };
        }
      }
    }

    var digits = s.replace(/\D/g, '');

    // 2. Direct full-number pastes without leading +
    // Georgia: 995 5XX... (12 digits)
    if (digits.indexOf('995') === 0 && digits.length >= 6) {
      return { country: COUNTRIES[0], digits: digits.substring(3), detected: true };
    }
    // Russia domestic format: 89XX... or 79XX... (11 digits)
    if ((digits.indexOf('89') === 0 || digits.indexOf('79') === 0) && digits.length === 11) {
      var ru = COUNTRIES.find(function(item) { return item.code === 'RU'; }) || COUNTRIES[1];
      return { country: ru, digits: digits.substring(1), detected: true };
    }
    // Kazakhstan: 77XX... (11 digits)
    if (digits.indexOf('77') === 0 && digits.length === 11) {
      var kz = COUNTRIES.find(function(item) { return item.code === 'KZ'; }) || COUNTRIES[4];
      return { country: kz, digits: digits.substring(1), detected: true };
    }
    // Ukraine: 380XX... (12 digits)
    if (digits.indexOf('380') === 0 && digits.length >= 6) {
      var ua = COUNTRIES.find(function(item) { return item.code === 'UA'; });
      if (ua) return { country: ua, digits: digits.substring(3), detected: true };
    }
    // Israel: 972XX... (12 digits)
    if (digits.indexOf('972') === 0 && digits.length >= 6) {
      var il = COUNTRIES.find(function(item) { return item.code === 'IL'; });
      if (il) return { country: il, digits: digits.substring(3), detected: true };
    }
    // Turkey: 90XX... (12 digits)
    if (digits.indexOf('90') === 0 && digits.length >= 6) {
      var tr = COUNTRIES.find(function(item) { return item.code === 'TR'; });
      if (tr) return { country: tr, digits: digits.substring(2), detected: true };
    }
    // Armenia: 374XX... (11 digits)
    if (digits.indexOf('374') === 0 && digits.length >= 6) {
      var am = COUNTRIES.find(function(item) { return item.code === 'AM'; });
      if (am) return { country: am, digits: digits.substring(3), detected: true };
    }
    // Azerbaijan: 994XX... (12 digits)
    if (digits.indexOf('994') === 0 && digits.length >= 6) {
      var az = COUNTRIES.find(function(item) { return item.code === 'AZ'; });
      if (az) return { country: az, digits: digits.substring(3), detected: true };
    }
    // Belarus: 375XX... (12 digits)
    if (digits.indexOf('375') === 0 && digits.length >= 6) {
      var by = COUNTRIES.find(function(item) { return item.code === 'BY'; });
      if (by) return { country: by, digits: digits.substring(3), detected: true };
    }
    // USA: 1XXX... (11 digits)
    if (digits.indexOf('1') === 0 && digits.length === 11) {
      var us = COUNTRIES.find(function(item) { return item.code === 'US'; });
      if (us) return { country: us, digits: digits.substring(1), detected: true };
    }

    // 3. Fallback: match any other country dial prefix if digits start with it
    if (digits.length >= 7) {
      for (var j = 0; j < COUNTRIES_BY_DIAL_LEN.length; j++) {
        var cand = COUNTRIES_BY_DIAL_LEN[j];
        var candDial = cand.dial.replace(/\D/g, '');
        if (candDial.length >= 2 && digits.indexOf(candDial) === 0) {
          return { country: cand, digits: digits.substring(candDial.length), detected: true };
        }
      }
    }

    return { country: currentCountry || selectedCountry || COUNTRIES[0], digits: digits, detected: false };
  }

  /**
   * Format national digits into clean, readable phone chunks
   */
  function formatPhoneDigits(digits, dialCode) {
    var d = digits.replace(/\D/g, '');
    if (dialCode === '+995') {
      // Georgia: 5XX XX-XX-XX
      if (d.length <= 3) return d;
      if (d.length <= 5) return d.slice(0, 3) + ' ' + d.slice(3);
      if (d.length <= 7) return d.slice(0, 3) + ' ' + d.slice(3, 5) + '-' + d.slice(5);
      return d.slice(0, 3) + ' ' + d.slice(3, 5) + '-' + d.slice(5, 7) + '-' + d.slice(7, 9);
    }
    if (dialCode === '+7') {
      // Russia / Kazakhstan: (XXX) XXX-XX-XX
      if (d.length <= 3) return d;
      if (d.length <= 6) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
      if (d.length <= 8) return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 8) + '-' + d.slice(8, 10);
    }
    if (dialCode === '+1') {
      // USA / Canada: (XXX) XXX-XXXX
      if (d.length <= 3) return d;
      if (d.length <= 6) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
      return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 10);
    }
    if (dialCode === '+972') {
      // Israel: XX XXX-XXXX
      if (d.length <= 2) return d;
      if (d.length <= 5) return d.slice(0, 2) + ' ' + d.slice(2);
      return d.slice(0, 2) + ' ' + d.slice(2, 5) + '-' + d.slice(5, 9);
    }
    if (dialCode === '+380') {
      // Ukraine: (XX) XXX-XX-XX
      if (d.length <= 2) return d;
      if (d.length <= 5) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 5) + '-' + d.slice(5);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 5) + '-' + d.slice(5, 7) + '-' + d.slice(7, 9);
    }
    // Generic grouping by 3s
    return d.replace(/(\d{3})(?=\d)/g, '$1 ');
  }

  function ensureModalDOM() {
    var existing = document.getElementById('mesti-phone-modal-root');
    if (existing) return existing;

    var root = document.createElement('div');
    root.id = 'mesti-phone-modal-root';
    root.innerHTML = [
      '<div class="mesti-phone-card" role="dialog" aria-modal="true">',
      '  <button type="button" class="mesti-phone-btn-icon mesti-phone-btn-back" id="mesti-phone-btn-back" style="display:none;" aria-label="Back">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      '  </button>',
      '  <button type="button" class="mesti-phone-btn-icon mesti-phone-btn-close" id="mesti-phone-btn-close" aria-label="Close">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '  </button>',
      '  <div id="mesti-phone-view-container"></div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(root);

    document.getElementById('mesti-phone-btn-close').addEventListener('click', closeModal);
    document.getElementById('mesti-phone-btn-back').addEventListener('click', function () {
      renderPhoneInputView(currentFullNumber);
    });

    root.addEventListener('click', function (e) {
      if (e.target === root) closeModal();
    });

    return root;
  }

  function getRecaptchaVerifier() {
    initFirebase();
    var host = document.getElementById('mesti-recaptcha-invisible-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mesti-recaptcha-invisible-host';
      host.style.cssText = 'position:fixed;bottom:0;right:0;width:0;height:0;overflow:hidden;z-index:9999999;';
      document.body.appendChild(host);
    }

    if (!window.mestiRecaptchaVerifier) {
      window.mestiRecaptchaVerifier = new window.firebase.auth.RecaptchaVerifier('mesti-recaptcha-invisible-host', {
        size: 'invisible'
      });
    }
    return window.mestiRecaptchaVerifier;
  }

  // --- Views ---

  function renderPhoneInputView(initialRaw, errorMsg) {
    var container = document.getElementById('mesti-phone-view-container');
    document.getElementById('mesti-phone-btn-back').style.display = 'none';

    var parsed = parseAndDetectCountry(initialRaw, selectedCountry);
    selectedCountry = parsed.country;
    var formattedDigits = formatPhoneDigits(parsed.digits, selectedCountry.dial);

    container.innerHTML = [
      '<div class="mesti-phone-header">',
      '  <img src="/Assets/general-green.png" class="mesti-phone-brand-logo" alt="MestiDelivery" />',
      '  <h3 class="mesti-phone-title">' + t('title_phone') + '</h3>',
      '  <p class="mesti-phone-subtitle">' + t('sub_phone') + '</p>',
      '</div>',
      errorMsg ? '<div class="mesti-phone-error">' + errorMsg + '</div>' : '',
      '<form id="mesti-phone-form" onsubmit="return false;">',
      '  <div class="mesti-phone-input-group">',
      '    <button type="button" class="mesti-country-picker-btn" id="mesti-btn-country-picker" title="' + getCountryName(selectedCountry) + '">',
      '      <span class="mesti-picker-flag-slot" id="mesti-picker-flag-slot">' + renderFlagHTML(selectedCountry) + '</span>',
      '      <span class="mesti-country-dial" id="mesti-dial-label">' + selectedCountry.dial + '</span>',
      '      <span class="mesti-country-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>',
      '    </button>',
      '    <input type="tel" id="mesti-phone-number-input" class="mesti-phone-main-input" placeholder="' + (selectedCountry.dial === '+995' ? '5XX XX-XX-XX' : 'XXX XXX-XXXX') + '" value="' + formattedDigits + '" autofocus autocomplete="tel">',
      '    <div class="mesti-country-dropdown" id="mesti-country-dropdown" style="display:none;">',
      '      <div class="mesti-country-search-wrap">',
      '        <div class="mesti-search-input-box">',
      '          <svg class="mesti-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
      '          <input type="text" class="mesti-country-search-input" id="mesti-country-search" placeholder="' + t('search_placeholder') + '" autocomplete="off">',
      '        </div>',
      '      </div>',
      '      <div class="mesti-popular-chips-wrap" id="mesti-popular-chips"></div>',
      '      <ul class="mesti-country-list" id="mesti-country-list"></ul>',
      '    </div>',
      '  </div>',
      '  <button type="submit" id="mesti-phone-submit-btn" class="mesti-phone-cta">',
      '    <span>' + t('btn_send') + '</span>',
      '  </button>',
      '</form>'
    ].join('\n');

    var pickerBtn = document.getElementById('mesti-btn-country-picker');
    var flagSlot = document.getElementById('mesti-picker-flag-slot');
    var dialLabel = document.getElementById('mesti-dial-label');
    var dropdown = document.getElementById('mesti-country-dropdown');
    var searchInput = document.getElementById('mesti-country-search');
    var countryList = document.getElementById('mesti-country-list');
    var popularChipsWrap = document.getElementById('mesti-popular-chips');
    var phoneInput = document.getElementById('mesti-phone-number-input');

    function applyCountrySelection(c, keepFocus) {
      selectedCountry = c;
      dialLabel.textContent = c.dial;
      flagSlot.innerHTML = renderFlagHTML(c);
      flagSlot.classList.remove('mesti-flag-pop');
      void flagSlot.offsetWidth; // trigger reflow
      flagSlot.classList.add('mesti-flag-pop');

      phoneInput.placeholder = (c.dial === '+995' ? '5XX XX-XX-XX' : (c.mask || 'XXX XXX-XXXX'));
      var curDigits = phoneInput.value.replace(/\D/g, '');
      phoneInput.value = formatPhoneDigits(curDigits, c.dial);

      dropdown.style.display = 'none';
      if (keepFocus !== false) {
        phoneInput.focus();
      }
    }

    // Populate Popular Quick Chips
    popularChipsWrap.innerHTML = '';
    POPULAR_CODES.forEach(function (code) {
      var c = COUNTRIES.find(function (item) { return item.code === code; });
      if (!c) return;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mesti-country-chip' + (selectedCountry.code === c.code ? ' active' : '');
      chip.innerHTML = renderFlagHTML(c, 'mesti-chip-flag') + '<span>' + c.code + ' ' + c.dial + '</span>';
      chip.addEventListener('click', function (e) {
        e.stopPropagation();
        applyCountrySelection(c, true);
      });
      popularChipsWrap.appendChild(chip);
    });

    // Populate Dropdown Countries List
    function populateCountries(filter) {
      countryList.innerHTML = '';
      var q = (filter || '').trim().toLowerCase();

      var filtered = COUNTRIES.filter(function (c) {
        if (!q) return true;
        var nameRu = (c.name || '').toLowerCase();
        var nameEn = (c.nameEn || '').toLowerCase();
        var nameKa = (c.nameKa || '').toLowerCase();
        var dial = (c.dial || '').toLowerCase();
        var code = (c.code || '').toLowerCase();
        return nameRu.indexOf(q) !== -1 || nameEn.indexOf(q) !== -1 || nameKa.indexOf(q) !== -1 || dial.indexOf(q) !== -1 || code.indexOf(q) !== -1;
      });

      if (!filtered.length) {
        var emptyLi = document.createElement('li');
        emptyLi.className = 'mesti-country-empty';
        emptyLi.textContent = 'Ничего не найдено';
        countryList.appendChild(emptyLi);
        return;
      }

      filtered.forEach(function (c) {
        var li = document.createElement('li');
        var isSelected = (selectedCountry.code === c.code);
        li.className = 'mesti-country-item' + (isSelected ? ' selected' : '');
        li.innerHTML = [
          '<div class="mesti-country-item-left">',
          '  ' + renderFlagHTML(c),
          '  <span class="mesti-country-item-name">' + getCountryName(c) + '</span>',
          '</div>',
          '<div class="mesti-country-item-right">',
          '  <span class="mesti-country-item-dial">' + c.dial + '</span>',
          isSelected ? '  <span class="mesti-country-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' : '',
          '</div>'
        ].join('');

        li.addEventListener('click', function (e) {
          e.stopPropagation();
          applyCountrySelection(c, true);
        });
        countryList.appendChild(li);
      });
    }

    populateCountries('');

    pickerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isVisible = (dropdown.style.display === 'flex');
      dropdown.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        searchInput.value = '';
        populateCountries('');
        setTimeout(function () { searchInput.focus(); }, 50);
      }
    });

    searchInput.addEventListener('input', function (e) {
      populateCountries(e.target.value);
    });

    // Close dropdown on click outside
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== pickerBtn && !pickerBtn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Smart Real-time typing & paste auto-detection
    function handlePhoneInput() {
      var raw = phoneInput.value;
      
      // If user typed '+' or started entering international format
      if (raw.indexOf('+') !== -1 || raw.replace(/\D/g, '').length >= 10) {
        var detected = parseAndDetectCountry(raw, selectedCountry);
        if (detected.detected && detected.country.code !== selectedCountry.code) {
          selectedCountry = detected.country;
          dialLabel.textContent = selectedCountry.dial;
          flagSlot.innerHTML = renderFlagHTML(selectedCountry);
          flagSlot.classList.remove('mesti-flag-pop');
          void flagSlot.offsetWidth;
          flagSlot.classList.add('mesti-flag-pop');
          phoneInput.placeholder = (selectedCountry.dial === '+995' ? '5XX XX-XX-XX' : (selectedCountry.mask || 'XXX XXX-XXXX'));
          phoneInput.value = formatPhoneDigits(detected.digits, selectedCountry.dial);
          return;
        }
      }

      var digitsOnly = raw.replace(/\D/g, '');
      phoneInput.value = formatPhoneDigits(digitsOnly, selectedCountry.dial);
    }

    phoneInput.addEventListener('input', handlePhoneInput);
    phoneInput.addEventListener('paste', function () {
      setTimeout(handlePhoneInput, 10);
    });

    document.getElementById('mesti-phone-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var rawDigits = phoneInput.value.replace(/\D/g, '');
      if (rawDigits.length < 6) {
        renderPhoneInputView(phoneInput.value, t('err_invalid_phone'));
        return;
      }
      var fullE164 = selectedCountry.dial + rawDigits;
      sendVerificationSms(fullE164);
    });

    setTimeout(function () { phoneInput.focus(); }, 100);
  }

  function renderOtpView(phoneNumber, errorMsg) {
    var container = document.getElementById('mesti-phone-view-container');
    document.getElementById('mesti-phone-btn-back').style.display = 'flex';

    container.innerHTML = [
      '<div class="mesti-phone-header">',
      '  <img src="/Assets/general-green.png" class="mesti-phone-brand-logo" alt="MestiDelivery" />',
      '  <h3 class="mesti-phone-title">' + t('title_otp') + '</h3>',
      '  <p class="mesti-phone-subtitle">' + t('sub_otp') + '<br/>',
      '    <span class="mesti-phone-highlight-badge">',
      '      ' + renderFlagHTML(selectedCountry, 'mesti-badge-flag') + ' ' + phoneNumber,
      '    </span>',
      '  </p>',
      '</div>',
      errorMsg ? '<div class="mesti-phone-error">' + errorMsg + '</div>' : '',
      '<div class="mesti-otp-container" id="mesti-otp-boxes">',
      '  <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="mesti-otp-cell" data-idx="0" autofocus>',
      '  <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="mesti-otp-cell" data-idx="1">',
      '  <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="mesti-otp-cell" data-idx="2">',
      '  <div class="mesti-otp-divider"></div>',
      '  <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="mesti-otp-cell" data-idx="3">',
      '  <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="mesti-otp-cell" data-idx="4">',
      '  <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="mesti-otp-cell" data-idx="5">',
      '</div>',
      '<button type="button" id="mesti-otp-submit-btn" class="mesti-phone-cta">',
      '  <span>' + t('btn_verify') + '</span>',
      '</button>',
      '<div class="mesti-phone-meta">',
      '  <span id="mesti-timer-text">' + t('resend_timer') + ' <b id="mesti-countdown">0:59</b></span>',
      '  <button type="button" id="mesti-resend-btn" class="mesti-phone-link" style="display:none;">' + t('resend_action') + '</button>',
      '</div>',
      '<div style="text-align:center;margin-top:14px;">',
      '  <button type="button" class="mesti-phone-link mesti-phone-link-muted" id="mesti-btn-change-number">' + t('change_number') + '</button>',
      '</div>'
    ].join('\n');

    setupOtpInputs();
    startCountdown(60);

    document.getElementById('mesti-btn-change-number').addEventListener('click', function () {
      renderPhoneInputView(currentFullNumber);
    });

    document.getElementById('mesti-resend-btn').addEventListener('click', function () {
      sendVerificationSms(currentFullNumber);
    });

    document.getElementById('mesti-otp-submit-btn').addEventListener('click', function () {
      submitOtpCode();
    });
  }

  function renderSuccessView(phone) {
    var container = document.getElementById('mesti-phone-view-container');
    document.getElementById('mesti-phone-btn-back').style.display = 'none';
    document.getElementById('mesti-phone-btn-close').style.display = 'none';

    container.innerHTML = [
      '<div style="text-align:center;padding:24px 0 16px;">',
      '  <div class="mesti-success-icon-wrap">',
      '    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      '  </div>',
      '  <h3 class="mesti-phone-title" style="margin-top:16px;">' + t('success_title') + '</h3>',
      '  <p class="mesti-phone-subtitle">' + t('success_sub') + '<br/>',
      '    <span class="mesti-phone-highlight-badge" style="margin-top:8px;">' + renderFlagHTML(selectedCountry, 'mesti-badge-flag') + ' ' + phone + '</span>',
      '  </p>',
      '</div>'
    ].join('\n');

    setTimeout(function () {
      closeModal();
    }, 1500);
  }

  // --- Logic & Actions ---

  function startCountdown(seconds) {
    if (timerInterval) clearInterval(timerInterval);

    var countEl = document.getElementById('mesti-countdown');
    var timerWrap = document.getElementById('mesti-timer-text');
    var resendBtn = document.getElementById('mesti-resend-btn');

    if (!countEl || !resendBtn) return;

    timerWrap.style.display = 'inline';
    resendBtn.style.display = 'none';

    var remaining = seconds;
    countEl.textContent = '0:' + (remaining < 10 ? '0' : '') + remaining;

    timerInterval = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerWrap.style.display = 'none';
        resendBtn.style.display = 'inline-block';
      } else {
        countEl.textContent = '0:' + (remaining < 10 ? '0' : '') + remaining;
      }
    }, 1000);
  }

  function setupOtpInputs() {
    var cells = document.querySelectorAll('.mesti-otp-cell');
    if (!cells.length) return;

    cells.forEach(function (cell, idx) {
      cell.addEventListener('input', function (e) {
        var val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val.charAt(val.length - 1) : '';

        if (e.target.value) {
          cell.classList.add('filled');
          if (idx < cells.length - 1) {
            cells[idx + 1].focus();
          } else {
            submitOtpCode();
          }
        } else {
          cell.classList.remove('filled');
        }
      });

      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          cells[idx - 1].focus();
        }
      });

      cell.addEventListener('paste', function (e) {
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text');
        var digits = paste.replace(/\D/g, '').slice(0, 6);
        if (digits.length > 0) {
          for (var i = 0; i < cells.length; i++) {
            cells[i].value = digits[i] || '';
            if (digits[i]) cells[i].classList.add('filled');
            else cells[i].classList.remove('filled');
          }
          if (digits.length >= 6) {
            cells[5].focus();
            submitOtpCode();
          } else {
            cells[digits.length].focus();
          }
        }
      });
    });

    setTimeout(function () { cells[0].focus(); }, 120);
  }

  function getOtpCodeValue() {
    var cells = document.querySelectorAll('.mesti-otp-cell');
    var code = '';
    cells.forEach(function (c) { code += c.value; });
    return code;
  }

  async function sendVerificationSms(phoneE164) {
    currentFullNumber = phoneE164;
    var btn = document.getElementById('mesti-phone-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="mesti-spinner"></div>';
    }

    try {
      initFirebase();
      var appVerifier = getRecaptchaVerifier();
      confirmationResult = await window.firebase.auth().signInWithPhoneNumber(phoneE164, appVerifier);
      renderOtpView(phoneE164);
    } catch (err) {
      console.error('[MestiPhoneAuth] Send SMS failed:', err);
      var msg = t('err_generic');
      var fullErr = String((err && (err.message || err.code)) || '');

      if (fullErr.indexOf('SMS unable to be sent until this region enabled') !== -1 || fullErr.indexOf('OPERATION_NOT_ALLOWED') !== -1) {
        msg = t('err_region_disabled');
      } else if (err.code === 'auth/invalid-phone-number') {
        msg = t('err_invalid_phone');
      } else if (err.code === 'auth/too-many-requests') {
        msg = t('err_too_many');
      } else if (err.code === 'auth/network-request-failed') {
        msg = t('err_network');
      }

      renderPhoneInputView(phoneE164, msg);
    }
  }

  async function submitOtpCode() {
    var code = getOtpCodeValue();
    if (code.length < 6) return;

    var btn = document.getElementById('mesti-otp-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="mesti-spinner"></div>';
    }

    try {
      if (!confirmationResult) {
        throw new Error('No active confirmation result');
      }

      var userCredential = await confirmationResult.confirm(code);
      var user = userCredential.user;
      var idToken = await user.getIdToken();

      var rawPhone = currentFullNumber;
      localStorage.setItem('user_phone', rawPhone);
      localStorage.setItem('phone_verified', '1');
      localStorage.setItem('phone_id_token', idToken);

      renderSuccessView(rawPhone);

      window.dispatchEvent(new CustomEvent('mestidelivery-phone-verified', {
        detail: {
          phone: rawPhone,
          idToken: idToken,
          user: user
        }
      }));

      if (currentPromise && currentPromise.resolve) {
        currentPromise.resolve({
          phone: rawPhone,
          idToken: idToken,
          user: user
        });
      }
    } catch (err) {
      console.error('[MestiPhoneAuth] Verification failed:', err);
      var msg = t('err_invalid_code');
      if (err.code === 'auth/code-expired') msg = t('err_expired');
      renderOtpView(currentFullNumber, msg);
    }
  }

  function closeModal() {
    var root = document.getElementById('mesti-phone-modal-root');
    if (root) root.classList.remove('active');
    if (timerInterval) clearInterval(timerInterval);
    if (currentPromise && currentPromise.reject) {
      currentPromise.reject(new Error('cancelled_by_user'));
      currentPromise = null;
    }
  }

  // --- Public API ---

  window.MestiPhoneAuth = {
    open: function (options) {
      options = options || {};
      var root = ensureModalDOM();
      root.classList.add('active');

      var phone = options.phone || localStorage.getItem('user_phone') || '';

      return new Promise(function (resolve, reject) {
        currentPromise = { resolve: resolve, reject: reject };
        renderPhoneInputView(phone);
      });
    },

    isVerified: function (phone) {
      if (!phone) return localStorage.getItem('phone_verified') === '1';
      var digits = String(phone).replace(/\D/g, '');
      var stored = String(localStorage.getItem('user_phone') || '').replace(/\D/g, '');
      return localStorage.getItem('phone_verified') === '1' && (stored === digits || digits.length < 6);
    },

    getVerifiedToken: function () {
      return localStorage.getItem('phone_id_token') || "";
    },

    close: closeModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initFirebase();
      ensureModalDOM();
    });
  } else {
    initFirebase();
    ensureModalDOM();
  }
})();
