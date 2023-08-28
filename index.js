const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const moment = require('moment');

const baseUrl = 'https://www.kolaynota.com/page/';
const totalPages = 157; // Toplam sayfa sayısı

async function getNotalarFromPage(pageNumber) {
  const url = `${baseUrl}${pageNumber}/`;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const notalar = [];

    $('.listing-item-blog-1').each((index, element) => {
      const imgSrc = $(element).find('.img-holder').attr('data-bg');
      const postTitleElement = $(element).find('.post-title');
      const postTitle = postTitleElement.text().trim();
      const postUrl = postTitleElement.attr('href');
      const postPublished = $(element).find('.post-published').attr('datetime');

      notalar.push({
        imgSrc,
        postTitle,
        postUrl,
        postPublished,
      });
    });

    return notalar;
  } catch (error) {
    console.error('Veriler getirilirken hata oluştu:', error);
    return [];
  }
}

async function getAllNotalar() {
  const allNotalar = [];

  for (let page = 0; page <= totalPages; page++) {
    const notalarFromPage = await getNotalarFromPage(page);
    allNotalar.push(...notalarFromPage);
  }

  return allNotalar;
}

async function getNotaImagesFromPost(postUrl) {
  try {
    const response = await axios.get(postUrl);
    const $ = cheerio.load(response.data);

    const notaImages = [];

    $('.entry-content .wp-block-image a').each((index, element) => {
      const imgSrc = $(element).attr('href');
      notaImages.push(imgSrc);
    });

    return notaImages;
  } catch (error) {
    console.error('Veriler getirilirken hata oluştu:', error);
    return [];
  }
}

(async () => {
  const allNotalar = await getAllNotalar();

  for (const nota of allNotalar) {
    nota.postPublished = moment(nota.postPublished).format('MMMM DD, YYYY');
    const notaImages = await getNotaImagesFromPost(nota.postUrl);
    nota.notaImages = notaImages;
  }

  try {
    await fs.writeFile('notalar.json', JSON.stringify(allNotalar, null, 2));
    console.log('Veriler notalar.json dosyasına kaydedildi.');
  } catch (error) {
    console.error('Hata:', error);
  }
})();
