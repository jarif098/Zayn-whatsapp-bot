const axios = require('axios');

module.exports = {
  name: 'currencybd',
  version: '1.0',
  author: 'JARiF',
  role: 0,
  description: 'Get current exchange rates for BDT',
  usage: 'currencybd',
  category: 'UTILITY',
  noPrefix: false,

  zayn: async ({ message }) => {
    try {
      const res = await axios.get('https://api.exchangerate-api.com/v4/latest/BDT');
      const rates = res.data.rates;

      const usd = rates['USD']?.toFixed(4);
      const eur = rates['EUR']?.toFixed(4);
      const inr = rates['INR']?.toFixed(4);

      const reply = `💱 *বাংলাদেশি টাকার বিনিময় হার*\n\n`
        + `১ BDT = ${usd} USD\n`
        + `১ BDT = ${eur} EUR\n`
        + `১ BDT = ${inr} INR`;

      await message.reply(reply);
    } catch (err) {
      await message.reply('❌ বিনিময় হার আনতে সমস্যা হয়েছে।');
    }
  }
};
