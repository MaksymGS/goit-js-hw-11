import axios from 'axios';
import Notiflix from 'notiflix';
import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';

const gallery = new SimpleLightbox('.gallery a');

const form = document.querySelector('#search-form');
const galleryCard = document.querySelector('.gallery');
const guard = document.querySelector('.load-more');

form.addEventListener('submit', handlerSearch);

let searchQuery = '';
let count = 0;
function handlerSearch(evt) {
  evt.preventDefault();
  searchQuery = evt.currentTarget.elements.searchQuery.value;
  serviceSearch()
    .then(resp => {
      if (resp.data.hits.length === 0) {
        Notiflix.Notify.failure(
          `Sorry, there are no images matching your search query. Please try again.`
        );
      } else {
        Notiflix.Notify.success(
          `Hooray! We found ${resp.data.totalHits} images.`
        );
      }
      count = resp.data.totalHits - resp.data.hits.length;
      page = 1;
      galleryCard.innerHTML = createMarkup(resp.data.hits);
      gallery.refresh();

      if (count > 0) {
        observer.observe(guard);
      }
    })
    .catch(err => console.log(err.message));
}

let page = 1;
const options = {
  rootMargin: '300px',
};
const observer = new IntersectionObserver(handlerLoadMore, options);

function handlerLoadMore(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      page += 1;
      if (count < 0 && entry.isIntersecting) {
        observer.unobserve(guard);
        Notiflix.Notify.failure(
          `We're sorry, but you've reached the end of search results.`
        );
        return;
      }
      serviceSearch(page)
        .then(resp => {
          count -= resp.data.hits.length;
          galleryCard.insertAdjacentHTML(
            'beforeend',
            createMarkup(resp.data.hits)
          );
          gallery.refresh();
          if (count > 0) {
            const { height: cardHeight } =
              galleryCard.firstElementChild.getBoundingClientRect();

            window.scrollBy({
              top: cardHeight * 2,
              behavior: 'smooth',
            });
          }
        })
        .catch(err => {
          console.log(err.message);
        });
    }
  });
}

async function serviceSearch(currentPage = '1') {
  const BASE_URL = 'https://pixabay.com/api/';
  const params = new URLSearchParams({
    key: '39251476-ee5588a1bda73807a34505b10',
    q: `${searchQuery}`,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page: currentPage,
    per_page: 40,
  });
  const resp = await axios.get(`${BASE_URL}?${params}`);
  return resp;
}
function createMarkup(arr) {
  return arr
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<a class="gallery__link" href="${largeImageURL}">
        <div class="photo-card">
        <img 
        class="gallery__image" 
        src="${webformatURL}" 
        alt="${tags}" 
      />
      <div class="info">
        <p class="info-item">
          <b>Likes</b>
        ${likes}</p>
        <p class="info-item">
          <b>Views</b>
        ${views}</p>
        <p class="info-item">
          <b>Comments</b>
        ${comments}</p>
        <p class="info-item">
          <b>Downloads</b>
        ${downloads}</p>
      </div>
    </div>
     </a>
        `
    )
    .join('');
}
