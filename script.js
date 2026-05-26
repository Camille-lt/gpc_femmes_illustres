import { categoryIcons } from "./arrayIcons.js";


const MAP_CONFIG = {
  center: [48.8566, 2.3522],
  zoom: 12,
  maxZoom: 17,
  minZoom: 11.3,
  maxBounds: [
    [48.815, 2.224],
    [48.902, 2.469],
  ],
  maxBoundsViscosity: 1.0,
};

// Photos spécifiques (manquantes dans l'api)
const CUSTOM_PHOTOS = {
  "Tatiana et Katia Levha": "photos/Tatiana_Katia_Levha.jpg",
  "Christelle Brua": "photos/Christelle_Brua.jpg",
  "Roxana Maracineanu": "photos/Roxana_Maracineanu.jpg",
  "Alessandra Montagne": "photos/Alessandra_Montagne.jpg",
  "Eleonora Zuliani": "photos/Eleonora_Zuliani.jpg",
  "Manon Fleury": "photos/Manon_Fleury.jpg",
  "Justine Piluso": "photos/Justine_PILUSO.jpg",
  "Hélène Darroze": "photos/Helene_Darroze.jpg",
  "Suzanne Lenglen": "photos/Suzanne_Lenglen.jpg",
};

// Adresses corrigées
const ADDRESS_CORRECTIONS = {
  "Suzanne Lenglen": "65, rue du Ranelagh, 75016 Paris",
  "Marie curie": "1, rue Pierre et Marie Curie, 75005 Paris",
  "Flora Tristan": "100bis rue du Bac, 75007 Paris",
  "Réjane": "15, Rue Blanche, 75009 Paris",
  "Marguerite Durand": "14 rue Saint-Georges,75009 Paris",
  "Émilie du Chatelet": "2, Rue Saint-Louis en l'Ile, 75004 Paris",
  "George Sand": "46, Rue Meslay 75003, Paris",
  "Françoise Barré-Sinoussi": "25-28, Rue du Docteur Roux, 75015 Paris",
  "Louise Michel": "Square Montmartre, 75018 Paris",
  "Germaine Tillion": "Place du Panthéon, 75005 Paris",
  "Nicole-Reine Lepaute": "5, rue de Vaugirard, 75006 Paris",
  "Jacqueline de Romilly": "12 rue Chernoviz, 75016 Paris",
  "Nikki de St Phalle": "Place Igor Stravinsky, 75003 paris",
};

//INITIALISATION DE LA CARTE
const map = L.map("map", MAP_CONFIG);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

//FONCTIONS OUTILS (SERVICES)
async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`
    );
    const dataMap = await response.json();
    return dataMap.length > 0 ? { lat: dataMap[0].lat, lon: dataMap[0].lon } : null;
  } catch (error) {
    console.error(`Erreur de géocodage pour : ${address}`, error);
    return null;
  }
}

function addMarker(coords, address, name, categoryText) {
  const { lat, lon } = coords;
  const categoryIcon = categoryIcons[categoryText]?.icon;

  const marker = L.marker([lat, lon], { icon: categoryIcon }).addTo(map);
  const popupContent = `<b>Nom :</b> ${name}<br><b>Adresse :</b> ${address}`;
  
  const togglePopup = () => {
    marker.bindPopup(popupContent).openPopup();
    setTimeout(() => marker.closePopup(), 3000);
  };

  togglePopup();
  marker.on("click", togglePopup);
}

// 4. USINE À COMPOSANTS DOM (CREATION CARTE)
function createWomanCard(woman) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("data-category", woman.tab_name);

  const cardInner = document.createElement("div");
  cardInner.classList.add("card-inner");

  // Front & Back
  const cardFront = document.createElement("div");
  cardFront.classList.add("card-front");
  const cardBack = document.createElement("div");
  cardBack.classList.add("card-back");

  // Nom
  const nameDiv = document.createElement("div");
  nameDiv.classList.add("name-index");
  const h2 = document.createElement("h2");
  h2.innerHTML = woman.name;
  nameDiv.appendChild(h2);

  // Catégorie
  const categoryDiv = document.createElement("div");
  categoryDiv.classList.add("categorie");
  const h3 = document.createElement("h3");
  h3.innerHTML = woman.tab_name;
  categoryDiv.appendChild(h3);

  // Photo (Gestion dynamique via le dictionnaire sans IF)
  const picturesDiv = document.createElement("div");
  picturesDiv.classList.add("women-pictures");
  const img = document.createElement("img");
  
  if (CUSTOM_PHOTOS[woman.name]) {
    img.setAttribute("src", CUSTOM_PHOTOS[woman.name]);
    img.style.width = "220px";
    img.style.height = "330px";
  } else {
    img.setAttribute("src", woman.thumb_url);
  }
  picturesDiv.appendChild(img);

  // Descriptions
  const allDescriptions = document.createElement("div");
  allDescriptions.classList.add("desc-all");
  for (let j = 1; j <= 5; j++) {
    if (woman[`desc${j}`]) {
      const p = document.createElement("p");
      p.innerHTML = woman[`desc${j}`];
      allDescriptions.appendChild(p);
    }
  }

  // Adresse
  const addressDiv = document.createElement("div");
  addressDiv.classList.add("women-address");
  const addressH3 = document.createElement("h3");
  addressH3.innerHTML = `Adresse : ${woman.short_desc}`;
  addressDiv.appendChild(addressH3);

  // Assemblage
  cardFront.append(nameDiv, picturesDiv);
  cardBack.append(categoryDiv, addressDiv, allDescriptions);
  cardInner.append(cardFront, cardBack);
  card.appendChild(cardInner);

  // Événements d'animation de la carte
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  card.addEventListener("mouseleave", () => card.classList.remove("flipped"));

  // Événement Clic pour le marqueur (Dictionnaire d'adresses sans IF)
  card.addEventListener("click", async function (e) {
    // Évite de déclencher le retournement ET la carte Leaflet en même temps si besoin
    let addressText = ADDRESS_CORRECTIONS[woman.name] || woman.short_desc;
    
    if (ADDRESS_CORRECTIONS[woman.name]) {
      woman.short_desc = addressText;
    }

    const coords = await geocodeAddress(addressText);
    if (coords) {
      addMarker(coords, addressText, woman.name, woman.tab_name.toLowerCase());
    } else {
      console.warn(`Impossible de géocoder l'adresse pour : ${woman.name}`);
    }
  });

  return card;
}

// 5. FONCTION PRINCIPALE
async function womenList() {
  const url = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/femmes-illustres-a-paris-portraits/records?limit=100&refine=tab_name%3A%22Artistes%22&refine=tab_name%3A%22Cheffes%22&refine=tab_name%3A%22Com%C3%A9diennes%22&refine=tab_name%3A%22Femmes%20de%20lettres%22&refine=tab_name%3A%22Politiques%22&refine=tab_name%3A%22Scientifiques%22&refine=tab_name%3A%22Sportives%22";
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    const container = document.querySelector("#womenPortraits");
    for (const woman of data.results) {
      const card = createWomanCard(woman);
      container.appendChild(card);
    }
    setupFiltering();
  } catch (error) {
    console.error("Erreur lors de la récupération des portraits :", error);
  }
}

womenList();

//SYSTÈME DE FILTRAGE
function setupFiltering() {
  const buttonIds = ["artButton", "chefButton", "comButton", "letButton", "polButton", "sciButton", "spButton", "allButton"];
  const buttons = buttonIds.map(id => document.getElementById(id)).filter(btn => btn !== null);
  const cards = document.querySelectorAll(".card");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCategory = button.getAttribute("data-category");

      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      cards.forEach((card) => {
        const cardCategory = card.getAttribute("data-category");
        const isVisible = selectedCategory === "all" || cardCategory === selectedCategory;
        card.style.display = isVisible ? "block" : "none";
      });
    });
  });
}