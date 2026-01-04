// Questionnaire Wizard - Elegant 4-slide pet questionnaire
// Note: Breed/size workflow removed in favor of activity/age/weight inputs.

// ========== Feeding Math Constants ==========
// Tunable without changing UI
const POUCH_GRAMS = 120;

// kcal per gram for each recipe (set with your real lab numbers when available)
const KCAL_PER_GRAM = {
  fish:    1.20,  // White Fish & Quinoa  ~120 kcal / 100g  → 1.20 kcal/g
  chicken: 1.35,  // Chicken Hearts & Rice ~135 kcal / 100g
  beef:    1.50   // Beef Hearts & Sweet Potato ~150 kcal / 100g
};

// Bounds and rounding preferences
const MIN_GRAMS = 60;    // don't suggest less than this per day
const MAX_GRAMS = 1200;  // safety ceiling
const GRAM_ROUND = 10;   // round grams to nearest 10 g
const POUCH_ROUND = 0.5; // round pouches to nearest 0.5

// Default meals per day (can vary by age)
const MEALS_PER_DAY = {
  puppy_kitten: 3,
  adult: 2,
  senior: 2
};

// ========== Helper Functions ==========
function roundTo(value, step) {
  return Math.round(value / step) * step;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ========== Complete FCI Breed Database (~360+ breeds) ==========
// Organized by FCI Groups with size and brachycephalic data
const DOG_BREED_DATA = {
  // FCI GROUP 1: Sheepdogs and Cattledogs
  "Australian Cattle Dog": {"size":"medium","brachy":false},
  "Australian Kelpie": {"size":"medium","brachy":false},
  "Australian Shepherd": {"size":"medium","brachy":false},
  "Bearded Collie": {"size":"medium","brachy":false},
  "Beauceron": {"size":"large","brachy":false},
  "Belgian Laekenois": {"size":"large","brachy":false},
  "Belgian Malinois": {"size":"large","brachy":false},
  "Belgian Sheepdog (Groenendael)": {"size":"large","brachy":false},
  "Belgian Tervuren": {"size":"large","brachy":false},
  "Bergamasco Shepherd": {"size":"large","brachy":false},
  "Berger Picard": {"size":"medium","brachy":false},
  "Border Collie": {"size":"medium","brachy":false},
  "Bouvier des Flandres": {"size":"large","brachy":false},
  "Briard": {"size":"large","brachy":false},
  "Canaan Dog": {"size":"medium","brachy":false},
  "Cardigan Welsh Corgi": {"size":"small","brachy":false},
  "Catalan Sheepdog": {"size":"medium","brachy":false},
  "Collie (Rough)": {"size":"large","brachy":false},
  "Collie (Smooth)": {"size":"large","brachy":false},
  "Croatian Sheepdog": {"size":"medium","brachy":false},
  "Czechoslovakian Wolfdog": {"size":"large","brachy":false},
  "Dutch Shepherd": {"size":"medium","brachy":false},
  "Finnish Lapphund": {"size":"medium","brachy":false},
  "German Shepherd": {"size":"large","brachy":false},
  "Icelandic Sheepdog": {"size":"medium","brachy":false},
  "Komondor": {"size":"giant","brachy":false},
  "Kuvasz": {"size":"giant","brachy":false},
  "Lancashire Heeler": {"size":"small","brachy":false},
  "Maremma Sheepdog": {"size":"giant","brachy":false},
  "Norwegian Buhund": {"size":"medium","brachy":false},
  "Old English Sheepdog": {"size":"large","brachy":false},
  "Pembroke Welsh Corgi": {"size":"small","brachy":false},
  "Polish Lowland Sheepdog": {"size":"medium","brachy":false},
  "Puli": {"size":"medium","brachy":false},
  "Pumi": {"size":"medium","brachy":false},
  "Pyrenean Shepherd": {"size":"medium","brachy":false},
  "Saarloos Wolfdog": {"size":"large","brachy":false},
  "Schapendoes": {"size":"medium","brachy":false},
  "Shetland Sheepdog": {"size":"small","brachy":false},
  "Swedish Lapphund": {"size":"medium","brachy":false},
  "Swedish Vallhund": {"size":"small","brachy":false},
  "White Swiss Shepherd": {"size":"large","brachy":false},

  // FCI GROUP 2: Pinscher, Schnauzer, Molossoid, Swiss Mountain and Cattledogs
  "Affenpinscher": {"size":"toy","brachy":false},
  "Anatolian Shepherd": {"size":"giant","brachy":false},
  "Appenzeller Sennenhund": {"size":"large","brachy":false},
  "Bernese Mountain Dog": {"size":"large","brachy":false},
  "Black Russian Terrier": {"size":"giant","brachy":false},
  "Boxer": {"size":"large","brachy":true},
  "Broholmer": {"size":"giant","brachy":false},
  "Bulldog (English)": {"size":"medium","brachy":true},
  "Bullmastiff": {"size":"giant","brachy":true},
  "Cane Corso": {"size":"large","brachy":false},
  "Caucasian Shepherd Dog": {"size":"giant","brachy":false},
  "Central Asian Shepherd Dog": {"size":"giant","brachy":false},
  "Doberman Pinscher": {"size":"large","brachy":false},
  "Dogo Argentino": {"size":"large","brachy":false},
  "Dogue de Bordeaux": {"size":"giant","brachy":true},
  "Entlebucher Mountain Dog": {"size":"medium","brachy":false},
  "Fila Brasileiro": {"size":"giant","brachy":false},
  "German Pinscher": {"size":"medium","brachy":false},
  "Giant Schnauzer": {"size":"large","brachy":false},
  "Great Dane": {"size":"giant","brachy":false},
  "Great Pyrenees": {"size":"giant","brachy":false},
  "Greater Swiss Mountain Dog": {"size":"giant","brachy":false},
  "Hovawart": {"size":"large","brachy":false},
  "Kangal Shepherd Dog": {"size":"giant","brachy":false},
  "Landseer": {"size":"giant","brachy":false},
  "Leonberger": {"size":"giant","brachy":false},
  "Mastiff (English)": {"size":"giant","brachy":true},
  "Miniature Pinscher": {"size":"toy","brachy":false},
  "Miniature Schnauzer": {"size":"small","brachy":false},
  "Neapolitan Mastiff": {"size":"giant","brachy":true},
  "Newfoundland": {"size":"giant","brachy":false},
  "Perro de Presa Canario": {"size":"giant","brachy":false},
  "Pyrenean Mastiff": {"size":"giant","brachy":false},
  "Rottweiler": {"size":"large","brachy":false},
  "Russian Black Terrier": {"size":"giant","brachy":false},
  "Schnauzer (Standard)": {"size":"medium","brachy":false},
  "Shar Pei": {"size":"medium","brachy":true},
  "Spanish Mastiff": {"size":"giant","brachy":false},
  "St. Bernard": {"size":"giant","brachy":false},
  "Tibetan Mastiff": {"size":"giant","brachy":false},
  "Tosa": {"size":"giant","brachy":false},

  // FCI GROUP 3: Terriers
  "Airedale Terrier": {"size":"medium","brachy":false},
  "American Staffordshire Terrier": {"size":"medium","brachy":false},
  "Australian Terrier": {"size":"small","brachy":false},
  "Bedlington Terrier": {"size":"medium","brachy":false},
  "Border Terrier": {"size":"small","brachy":false},
  "Boston Terrier": {"size":"small","brachy":true},
  "Bull Terrier": {"size":"medium","brachy":false},
  "Bull Terrier (Miniature)": {"size":"small","brachy":false},
  "Cairn Terrier": {"size":"small","brachy":false},
  "Cesky Terrier": {"size":"small","brachy":false},
  "Dandie Dinmont Terrier": {"size":"small","brachy":false},
  "Fox Terrier (Smooth)": {"size":"small","brachy":false},
  "Fox Terrier (Wire)": {"size":"small","brachy":false},
  "Glen of Imaal Terrier": {"size":"small","brachy":false},
  "Irish Terrier": {"size":"medium","brachy":false},
  "Jack Russell Terrier": {"size":"small","brachy":false},
  "Kerry Blue Terrier": {"size":"medium","brachy":false},
  "Lakeland Terrier": {"size":"small","brachy":false},
  "Manchester Terrier": {"size":"small","brachy":false},
  "Norfolk Terrier": {"size":"small","brachy":false},
  "Norwich Terrier": {"size":"small","brachy":false},
  "Parson Russell Terrier": {"size":"small","brachy":false},
  "Scottish Terrier": {"size":"small","brachy":false},
  "Sealyham Terrier": {"size":"small","brachy":false},
  "Skye Terrier": {"size":"small","brachy":false},
  "Soft Coated Wheaten Terrier": {"size":"medium","brachy":false},
  "Staffordshire Bull Terrier": {"size":"medium","brachy":false},
  "Welsh Terrier": {"size":"small","brachy":false},
  "West Highland White Terrier": {"size":"small","brachy":false},

  // FCI GROUP 4: Dachshunds
  "Dachshund (Miniature Long-haired)": {"size":"small","brachy":false},
  "Dachshund (Miniature Smooth-haired)": {"size":"small","brachy":false},
  "Dachshund (Miniature Wire-haired)": {"size":"small","brachy":false},
  "Dachshund (Standard Long-haired)": {"size":"small","brachy":false},
  "Dachshund (Standard Smooth-haired)": {"size":"small","brachy":false},
  "Dachshund (Standard Wire-haired)": {"size":"small","brachy":false},

  // FCI GROUP 5: Spitz and Primitive Types
  "Akita": {"size":"large","brachy":false},
  "Alaskan Malamute": {"size":"large","brachy":false},
  "American Akita": {"size":"large","brachy":false},
  "American Eskimo Dog": {"size":"medium","brachy":false},
  "Basenji": {"size":"small","brachy":false},
  "Canaan Dog": {"size":"medium","brachy":false},
  "Chow Chow": {"size":"medium","brachy":true},
  "Cirneco dell'Etna": {"size":"small","brachy":false},
  "Eurasier": {"size":"medium","brachy":false},
  "Finnish Spitz": {"size":"medium","brachy":false},
  "German Spitz (Giant)": {"size":"large","brachy":false},
  "German Spitz (Klein)": {"size":"small","brachy":false},
  "German Spitz (Mittel)": {"size":"medium","brachy":false},
  "Greenland Dog": {"size":"large","brachy":false},
  "Hokkaido": {"size":"medium","brachy":false},
  "Icelandic Sheepdog": {"size":"medium","brachy":false},
  "Italian Volpino": {"size":"toy","brachy":false},
  "Japanese Spitz": {"size":"small","brachy":false},
  "Kai Ken": {"size":"medium","brachy":false},
  "Karelian Bear Dog": {"size":"large","brachy":false},
  "Keeshond": {"size":"medium","brachy":false},
  "Kishu Ken": {"size":"medium","brachy":false},
  "Korean Jindo": {"size":"medium","brachy":false},
  "Norwegian Elkhound": {"size":"medium","brachy":false},
  "Norwegian Lundehund": {"size":"small","brachy":false},
  "Peruvian Inca Orchid": {"size":"medium","brachy":false},
  "Pharaoh Hound": {"size":"large","brachy":false},
  "Pomeranian": {"size":"toy","brachy":false},
  "Portuguese Podengo (Grande)": {"size":"large","brachy":false},
  "Portuguese Podengo (Medio)": {"size":"medium","brachy":false},
  "Portuguese Podengo (Pequeno)": {"size":"small","brachy":false},
  "Samoyed": {"size":"medium","brachy":false},
  "Schipperke": {"size":"small","brachy":false},
  "Shiba Inu": {"size":"small","brachy":false},
  "Shikoku": {"size":"medium","brachy":false},
  "Siberian Husky": {"size":"medium","brachy":false},
  "Thai Ridgeback": {"size":"medium","brachy":false},
  "Xoloitzcuintli (Standard)": {"size":"medium","brachy":false},
  "Xoloitzcuintli (Miniature)": {"size":"small","brachy":false},
  "Xoloitzcuintli (Toy)": {"size":"toy","brachy":false},

  // FCI GROUP 6: Scent Hounds and Related Breeds
  "Alpine Dachsbracke": {"size":"small","brachy":false},
  "American Foxhound": {"size":"large","brachy":false},
  "Basset Artesien Normand": {"size":"small","brachy":false},
  "Basset Bleu de Gascogne": {"size":"small","brachy":false},
  "Basset Fauve de Bretagne": {"size":"small","brachy":false},
  "Basset Hound": {"size":"medium","brachy":false},
  "Bavarian Mountain Scent Hound": {"size":"medium","brachy":false},
  "Beagle": {"size":"small","brachy":false},
  "Beagle-Harrier": {"size":"medium","brachy":false},
  "Bloodhound": {"size":"large","brachy":false},
  "Black and Tan Coonhound": {"size":"large","brachy":false},
  "Bluetick Coonhound": {"size":"large","brachy":false},
  "Dachshund": {"size":"small","brachy":false},
  "Dalmatian": {"size":"large","brachy":false},
  "English Foxhound": {"size":"large","brachy":false},
  "Finnish Hound": {"size":"medium","brachy":false},
  "Grand Basset Griffon Vendeen": {"size":"medium","brachy":false},
  "Hamiltonstovare": {"size":"large","brachy":false},
  "Harrier": {"size":"medium","brachy":false},
  "Ibizan Hound": {"size":"large","brachy":false},
  "Norwegian Hound": {"size":"medium","brachy":false},
  "Otterhound": {"size":"large","brachy":false},
  "Petit Basset Griffon Vendeen": {"size":"small","brachy":false},
  "Plott Hound": {"size":"large","brachy":false},
  "Redbone Coonhound": {"size":"large","brachy":false},
  "Rhodesian Ridgeback": {"size":"large","brachy":false},
  "Segugio Italiano": {"size":"medium","brachy":false},
  "Treeing Walker Coonhound": {"size":"large","brachy":false},

  // FCI GROUP 7: Pointing Dogs
  "Ariege Pointer": {"size":"large","brachy":false},
  "Bracco Italiano": {"size":"large","brachy":false},
  "Braque d'Auvergne": {"size":"large","brachy":false},
  "Braque du Bourbonnais": {"size":"medium","brachy":false},
  "Braque Francais": {"size":"large","brachy":false},
  "Braque Saint-Germain": {"size":"large","brachy":false},
  "Brittany": {"size":"medium","brachy":false},
  "English Pointer": {"size":"large","brachy":false},
  "English Setter": {"size":"large","brachy":false},
  "German Longhaired Pointer": {"size":"large","brachy":false},
  "German Shorthaired Pointer": {"size":"large","brachy":false},
  "German Wirehaired Pointer": {"size":"large","brachy":false},
  "Gordon Setter": {"size":"large","brachy":false},
  "Hungarian Vizsla": {"size":"large","brachy":false},
  "Hungarian Wirehaired Vizsla": {"size":"large","brachy":false},
  "Irish Red and White Setter": {"size":"large","brachy":false},
  "Irish Setter": {"size":"large","brachy":false},
  "Large Munsterlander": {"size":"large","brachy":false},
  "Perdiguero de Burgos": {"size":"large","brachy":false},
  "Portuguese Pointer": {"size":"medium","brachy":false},
  "Pudelpointer": {"size":"large","brachy":false},
  "Small Munsterlander": {"size":"medium","brachy":false},
  "Spinone Italiano": {"size":"large","brachy":false},
  "Weimaraner": {"size":"large","brachy":false},
  "Wirehaired Pointing Griffon": {"size":"medium","brachy":false},

  // FCI GROUP 8: Retrievers, Flushing Dogs, Water Dogs
  "American Cocker Spaniel": {"size":"small","brachy":false},
  "American Water Spaniel": {"size":"medium","brachy":false},
  "Barbet": {"size":"medium","brachy":false},
  "Boykin Spaniel": {"size":"medium","brachy":false},
  "Chesapeake Bay Retriever": {"size":"large","brachy":false},
  "Clumber Spaniel": {"size":"medium","brachy":false},
  "Curly-Coated Retriever": {"size":"large","brachy":false},
  "English Cocker Spaniel": {"size":"small","brachy":false},
  "English Springer Spaniel": {"size":"medium","brachy":false},
  "Field Spaniel": {"size":"medium","brachy":false},
  "Flat-Coated Retriever": {"size":"large","brachy":false},
  "Golden Retriever": {"size":"large","brachy":false},
  "Irish Water Spaniel": {"size":"large","brachy":false},
  "Labrador Retriever": {"size":"large","brachy":false},
  "Lagotto Romagnolo": {"size":"medium","brachy":false},
  "Nova Scotia Duck Tolling Retriever": {"size":"medium","brachy":false},
  "Portuguese Water Dog": {"size":"medium","brachy":false},
  "Spanish Water Dog": {"size":"medium","brachy":false},
  "Sussex Spaniel": {"size":"medium","brachy":false},
  "Welsh Springer Spaniel": {"size":"medium","brachy":false},

  // FCI GROUP 9: Companion and Toy Dogs
  "Bichon Frise": {"size":"small","brachy":false},
  "Bolognese": {"size":"toy","brachy":false},
  "Boston Terrier": {"size":"small","brachy":true},
  "Brussels Griffon": {"size":"toy","brachy":true},
  "Cavalier King Charles Spaniel": {"size":"small","brachy":false},
  "Chihuahua (Long-haired)": {"size":"toy","brachy":false},
  "Chihuahua (Smooth-haired)": {"size":"toy","brachy":false},
  "Chinese Crested": {"size":"toy","brachy":false},
  "Coton de Tulear": {"size":"small","brachy":false},
  "English Toy Spaniel": {"size":"toy","brachy":true},
  "French Bulldog": {"size":"small","brachy":true},
  "Havanese": {"size":"toy","brachy":false},
  "Italian Greyhound": {"size":"toy","brachy":false},
  "Japanese Chin": {"size":"toy","brachy":true},
  "King Charles Spaniel": {"size":"toy","brachy":true},
  "Lhasa Apso": {"size":"small","brachy":true},
  "Lowchen": {"size":"small","brachy":false},
  "Maltese": {"size":"toy","brachy":false},
  "Miniature Poodle": {"size":"small","brachy":false},
  "Papillon": {"size":"toy","brachy":false},
  "Pekingese": {"size":"toy","brachy":true},
  "Poodle (Standard)": {"size":"large","brachy":false},
  "Poodle (Toy)": {"size":"toy","brachy":false},
  "Pug": {"size":"small","brachy":true},
  "Russian Toy": {"size":"toy","brachy":false},
  "Shih Tzu": {"size":"small","brachy":true},
  "Tibetan Spaniel": {"size":"small","brachy":true},
  "Tibetan Terrier": {"size":"medium","brachy":false},
  "Yorkshire Terrier": {"size":"toy","brachy":false},

  // FCI GROUP 10: Sighthounds
  "Afghan Hound": {"size":"large","brachy":false},
  "Azawakh": {"size":"large","brachy":false},
  "Borzoi": {"size":"giant","brachy":false},
  "Chart Polski": {"size":"large","brachy":false},
  "Greyhound": {"size":"large","brachy":false},
  "Irish Wolfhound": {"size":"giant","brachy":false},
  "Italian Greyhound": {"size":"toy","brachy":false},
  "Magyar Agar": {"size":"large","brachy":false},
  "Saluki": {"size":"large","brachy":false},
  "Scottish Deerhound": {"size":"giant","brachy":false},
  "Sloughi": {"size":"large","brachy":false},
  "Spanish Galgo": {"size":"large","brachy":false},
  "Whippet": {"size":"medium","brachy":false},

  // Non-FCI / Other Popular Breeds
  "American Pit Bull Terrier": {"size":"medium","brachy":false},
  "Australian Labradoodle": {"size":"medium","brachy":false},
  "Cockapoo": {"size":"small","brachy":false},
  "Goldendoodle": {"size":"large","brachy":false},
  "Labradoodle": {"size":"large","brachy":false},
  "Mixed Breed": {"size":"medium","brachy":false},
  "Pomsky": {"size":"small","brachy":false},
  "Unknown": {"size":"medium","brachy":false},
  "Others...": {"size":null,"brachy":false}  // Size unlocked - user must select manually
};

// Sort breeds alphabetically, but keep "Others..." at the end
const DOG_BREEDS = Object.keys(DOG_BREED_DATA)
  .filter(breed => breed !== "Others...")
  .sort()
  .concat(["Others..."]);

// Sort cat breeds alphabetically, but keep "Others..." at the end
const CAT_BREEDS = [
  "Persian", "British Shorthair", "Siamese", "Scottish Fold", "Maine Coon", "Ragdoll",
  "Sphynx", "Bengal", "Exotic Shorthair", "American Shorthair", "Russian Blue", "Turkish Angora",
  "Norwegian Forest Cat", "Abyssinian", "Birman", "Oriental Shorthair", "Savannah", "Egyptian Mau",
  "Himalayan", "Manx", "Tonkinese", "Chartreux", "Bombay", "Cornish Rex", "Devon Rex", "Balinese",
  "Burmese", "Scottish Straight", "Selkirk Rex", "Kurilian Bobtail", "Neva Masquerade", "American Curl",
  "LaPerm", "Somali", "Turkish Van", "Japanese Bobtail", "Arabian Mau", "Ocicat", "Pixiebob", "Munchkin",
  "Mixed / Unknown"
].sort().concat(["Others..."]);

class QuestionnaireWizard {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 5; // Changed from 4 to 5 slides
    this.formData = {
      petType: '',       // 'cat' | 'dog'
      name: '',

      // NEW Slide 2: Breed + Size + Brachycephalic
      breed: '',         // Breed name from dropdown
      customBreed: '',   // Custom breed name when "Others..." is selected
      size: '',          // 'toy' | 'small' | 'medium' | 'large' | 'giant'
      brachycephalic: false, // true if breed has flat face (breathing issues)

      // Slide 3: Activity + Age (moved from Slide 2)
      activity: '',      // 'mellow' | 'active' | 'very_active' | 'athlete' (4 levels)
      ageGroup: '',      // 'puppy_kitten' | 'adult' | 'senior'

      // Slide 4: Weight + Neutered (moved from Slide 3)
      weightValue: '',   // numeric string
      weightUnit: 'kg',  // 'kg' | 'lb'
      idealWeightValue: '', // optional
      neutered: '',      // 'yes' | 'no'

      // Slide 5: Contact + Allergies (moved from Slide 4)
      allergies: [],     // tags: 'chicken' | 'beef' | 'fish' | 'grain' | ...
      phone: '',
      email: ''          // Email for non-logged-in users
    };
    
    this.isEditMode = false;
    this.hasExistingData = false;
    this.currentPetId = null; // Store the pet ID if editing existing pet
    this.pendingData = null; // Store data if user needs to login first
    
    this.init();
  }
  
  /**
   * Map questionnaire data to Pet record format
   * Maps questionnaire fields to backend Pet API expected format
   */
  mapQuestionnaireToPetData() {
    const { formData } = this;
    
    // Convert weight to kg (backend expects weight_kg)
    let weightKg = null;
    if (formData.weightValue) {
      const weightVal = parseFloat(formData.weightValue);
      if (!isNaN(weightVal)) {
        weightKg = formData.weightUnit === 'lb' 
          ? (weightVal * 0.45359237) 
          : weightVal;
      }
    }
    
    // Map activity levels: questionnaire uses 'mellow'|'active'|'very_active'|'athlete'
    // Backend expects 'low'|'normal'|'high'
    let activityLevel = 'normal'; // default
    if (formData.activity === 'mellow') {
      activityLevel = 'low';
    } else if (formData.activity === 'active') {
      activityLevel = 'normal';
    } else if (formData.activity === 'very_active' || formData.activity === 'athlete') {
      activityLevel = 'high';
    }
    
    // Map age groups: questionnaire uses 'puppy_kitten'|'adult'|'senior'
    // Backend expects 'puppy'|'kitten'|'adult'|'senior'
    let ageGroup = formData.ageGroup;
    if (ageGroup === 'puppy_kitten') {
      ageGroup = formData.petType === 'cat' ? 'kitten' : 'puppy';
    }
    
    // Determine goal from ideal weight vs current weight
    let goal = 'maintain';
    if (formData.idealWeightValue) {
      const idealVal = parseFloat(formData.idealWeightValue);
      const currentVal = parseFloat(formData.weightValue);
      if (!isNaN(idealVal) && !isNaN(currentVal)) {
        const idealKg = formData.weightUnit === 'lb' ? (idealVal * 0.45359237) : idealVal;
        if (idealKg < weightKg * 0.95) {
          goal = 'lose_weight';
        } else if (idealKg > weightKg * 1.05) {
          goal = 'gain_weight';
        }
      }
    }
    
    // Build notes field with allergies and other info
    const notesParts = [];
    if (formData.allergies && formData.allergies.length > 0) {
      notesParts.push(`Allergies: ${formData.allergies.join(', ')}`);
    }
    if (formData.neutered) {
      notesParts.push(`Neutered: ${formData.neutered === 'yes' ? 'Yes' : 'No'}`);
    }
    if (formData.brachycephalic) {
      notesParts.push('Brachycephalic breed');
    }
    const notes = notesParts.length > 0 ? notesParts.join('; ') : null;
    
    // Determine breed (use custom breed if "Others..." was selected)
    const breed = (formData.breed === 'Others...' && formData.customBreed) 
      ? formData.customBreed 
      : (formData.breed || null);
    
    return {
      name: formData.name || 'Unnamed Pet',
      type: formData.petType, // 'dog' or 'cat'
      breed: breed,
      weight_kg: weightKg,
      age_group: ageGroup,
      activity_level: activityLevel,
      goal: goal,
      notes: notes
    };
  }

  async init() {
    // Check if user is logged in and has existing questionnaire data
    await this.loadExistingQuestionnaire();
    this.renderWizard();
    this.attachEventListeners();
    
    // Check for pending data after login
    this.checkForPendingData();
  }

  checkForPendingData() {
    // Check URL for questionnaire=pending parameter (after login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('questionnaire') === 'pending') {
      // Wait a bit for API to be ready, then handle pending submission
      setTimeout(() => {
        this.handlePostLoginSubmission();
      }, 500);
    }
  }

  async loadExistingQuestionnaire() {
    // Wait for API to be available and user is logged in
    if (!window.isLoggedIn || !window.isLoggedIn()) {
      console.log('ℹ️ User not logged in, skipping questionnaire load');
      return;
    }
    
    // If we already have a pet ID set (e.g., from manual edit), don't overwrite it
    if (this.currentPetId && this.isEditMode && this.hasExistingData) {
      console.log('ℹ️ Pet already loaded for editing, skipping auto-load');
      return;
    }
    
    // Step 1: Try to load from Pets API first (source of truth)
    if (typeof window.petsAPI !== 'undefined' && window.petsAPI.getAll) {
      try {
        const pets = await window.petsAPI.getAll();
        if (pets && pets.length > 0) {
          // Load the most recent pet (or first one if multiple)
          const pet = pets[0];
          this.currentPetId = pet.id;
          this.isEditMode = true;
          this.hasExistingData = true;
          
          // Map pet data to questionnaire format
          this.formData = this.mapPetToQuestionnaireData(pet);
          
          // Also try to load questionnaire JSON for additional fields (allergies, recommendations, etc.)
          await this.loadQuestionnaireJSONForPet(pet.id);
          
          console.log('✅ Loaded existing pet data:', pet);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Could not load pets:', error);
      }
    }
    
    // Step 2: Fallback to questionnaire JSON (for backward compatibility)
    if (typeof window.accountAPI !== 'undefined' && window.accountAPI.getQuestionnaire) {
      try {
        const response = await window.accountAPI.getQuestionnaire();
        if (response && response.questionnaire) {
          const data = response.questionnaire;
          this.isEditMode = true;
          this.hasExistingData = true;
          
          // If questionnaire has pet_id, try to load that pet
          if (data.pet_id && typeof window.petsAPI !== 'undefined') {
            try {
              const pet = await window.petsAPI.getOne(data.pet_id);
              if (pet) {
                this.currentPetId = pet.id;
                // Merge pet data (source of truth) with questionnaire data (additional fields)
                this.formData = {
                  ...this.mapPetToQuestionnaireData(pet),
                  // Override with questionnaire-specific fields
                  allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
                  phone: data.phone || '',
                  email: data.email || '',
                  recommendation: data.recommendation || null,
                  recommendationData: data.recommendation_data || null
                };
                console.log('✅ Loaded pet + questionnaire data');
                return;
              }
            } catch (e) {
              console.warn('⚠️ Could not load pet by ID:', e);
            }
          }
          
          // Fallback: use questionnaire data only
          this.formData = {
            petType: data.pet_type || '',
            name: data.pet_name || '',
            breed: data.breed || '',
            customBreed: data.custom_breed || '',
            size: data.size || '',
            brachycephalic: data.brachycephalic || false,
            activity: data.activity || '',
            ageGroup: data.age_group || '',
            weightValue: data.weight_value || '',
            weightUnit: data.weight_unit || 'kg',
            idealWeightValue: data.ideal_weight_value || '',
            neutered: data.neutered || '',
            allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
            phone: data.phone || '',
            email: data.email || ''
          };
          
          console.log('✅ Loaded existing questionnaire data (legacy)');
        }
      } catch (error) {
        console.log('ℹ️ No existing questionnaire data found (new user)');
        this.isEditMode = false;
        this.hasExistingData = false;
      }
    }
  }
  
  /**
   * Map Pet record to questionnaire form data format
   */
  mapPetToQuestionnaireData(pet) {
    // Convert weight_kg back to questionnaire format
    let weightValue = '';
    let weightUnit = 'kg';
    if (pet.weight_kg) {
      weightValue = pet.weight_kg.toString();
    }
    
    // Map activity_level back: 'low'|'normal'|'high' -> 'mellow'|'active'|'very_active'
    let activity = 'active'; // default
    if (pet.activity_level === 'low') {
      activity = 'mellow';
    } else if (pet.activity_level === 'normal') {
      activity = 'active';
    } else if (pet.activity_level === 'high') {
      activity = 'very_active';
    }
    
    // Map age_group back: 'puppy'|'kitten'|'adult'|'senior' -> 'puppy_kitten'|'adult'|'senior'
    let ageGroup = pet.age_group || '';
    if (ageGroup === 'puppy' || ageGroup === 'kitten') {
      ageGroup = 'puppy_kitten';
    }
    
    // Parse notes for allergies and neutered status
    let allergies = [];
    let neutered = '';
    if (pet.notes) {
      // Try to extract allergies from notes
      const allergiesMatch = pet.notes.match(/Allergies:\s*([^;]+)/);
      if (allergiesMatch) {
        allergies = allergiesMatch[1].split(',').map(a => a.trim());
      }
      
      // Check for neutered status
      const neuteredMatch = pet.notes.match(/Neutered:\s*(Yes|No)/);
      if (neuteredMatch) {
        neutered = neuteredMatch[1].toLowerCase() === 'yes' ? 'yes' : 'no';
      }
    }
    
    // Determine brachycephalic from breed (would need breed database lookup)
    const brachycephalic = false; // Default, could be enhanced with breed lookup
    
    return {
      petType: pet.type || '',
      name: pet.name || '',
      breed: pet.breed || '',
      customBreed: '', // Would need to check if breed is in dropdown
      size: '', // Not stored in pet record
      brachycephalic: brachycephalic,
      activity: activity,
      ageGroup: ageGroup,
      weightValue: weightValue,
      weightUnit: weightUnit,
      idealWeightValue: '', // Not stored in pet record
      neutered: neutered,
      allergies: allergies,
      phone: '',
      email: ''
    };
  }
  
  /**
   * Load questionnaire JSON for additional fields (allergies, recommendations, etc.)
   */
  async loadQuestionnaireJSONForPet(petId) {
    try {
      if (typeof window.accountAPI === 'undefined' || !window.accountAPI.getQuestionnaire) {
        return;
      }
      
      const response = await window.accountAPI.getQuestionnaire();
      if (response && response.questionnaire && response.questionnaire.pet_id === petId) {
        const data = response.questionnaire;
        // Merge additional fields from questionnaire JSON
        if (data.allergies) {
          this.formData.allergies = Array.isArray(data.allergies) ? data.allergies : [data.allergies];
        }
        if (data.phone) this.formData.phone = data.phone;
        if (data.email) this.formData.email = data.email;
        if (data.recommendation) this.formData.recommendation = data.recommendation;
        if (data.recommendation_data) this.formData.recommendationData = data.recommendation_data;
      }
    } catch (error) {
      // Non-critical - questionnaire JSON is optional
      console.log('ℹ️ Could not load questionnaire JSON (non-critical)');
    }
  }

  /**
   * Reset wizard state for creating a new pet
   * Called when user clicks "Add Pet" button
   */
  resetForNewPet() {
    console.log('🔄 Resetting questionnaire wizard for new pet...');
    
    // Reset form data to initial empty state
    this.formData = {
      petType: '',
      name: '',
      breed: '',
      customBreed: '',
      size: '',
      brachycephalic: false,
      activity: '',
      ageGroup: '',
      weightValue: '',
      weightUnit: 'kg',
      idealWeightValue: '',
      neutered: '',
      allergies: [],
      phone: ''
    };
    
    // Reset wizard state
    this.currentSlide = 1;
    this.isEditMode = false;
    this.hasExistingData = false;
    this.currentPetId = null;
    this.pendingData = null;
    
    console.log('✅ Questionnaire wizard reset for new pet');
  }

  renderWizard() {
    const modal = document.getElementById('questionnaireModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    // Update modal title based on edit mode
    const modalTitle = this.isEditMode ? 'Edit Pet Information' : 'Pet Questionnaire';

    // Replace modal content with wizard
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 id="modalTitle">${modalTitle}</h2>
        <button class="modal-close" aria-label="Close questionnaire">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <div class="wizard-progress">
        <div class="wizard-progress-text" aria-live="polite">Step <span id="currentStep">1</span> of ${this.totalSlides}</div>
        <div class="wizard-progress-bar">
          <div class="wizard-progress-fill" id="progressFill" style="width: 20%"></div>
        </div>
      </div>

      <div class="wizard-container">
        ${this.renderSlide1()}
        ${this.renderSlide2()}
        ${this.renderSlide3()}
        ${this.renderSlide4()}
        ${this.renderSlide5()}
        ${this.renderResultSlide()}
      </div>

      <div class="wizard-actions">
        <button type="button" class="btn btn-outline wizard-btn-back" id="wizardBack" disabled>Back</button>
        <button type="button" class="btn btn-primary wizard-btn-next" id="wizardNext" disabled>Next</button>
      </div>
    `;
  }

  renderSlide1() {
    return `
      <div class="wizard-slide" id="slide1" data-slide="1">
        <div class="wizard-slide-content">
          <h3 class="wizard-slide-title">Let's get to know your pet</h3>
          
          <div class="form-group">
            <label class="form-label">What is your pet?</label>
            <div class="button-group pet-type-grid" role="radiogroup" aria-label="Pet type">
              <button type="button" class="btn-choice" data-field="petType" data-value="cat" role="radio" aria-checked="false">
                <span style="font-size: 32px;">🐱</span>
                <span>Cat</span>
              </button>
              <button type="button" class="btn-choice" data-field="petType" data-value="dog" role="radio" aria-checked="false">
                <span style="font-size: 32px;">🐶</span>
                <span>Dog</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="nameInput">What is your pet's name?</label>
            <input id="nameInput" class="form-input" type="text" placeholder="e.g., Luna" />
            <div class="form-helper">We'll use this to personalize your experience</div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlide2() {
    return `
      <div class="wizard-slide" id="slide2" data-slide="2" style="display:none">
        <div class="wizard-slide-content">
          <h3 class="wizard-slide-title">About <span id="wizNameBreed">your pet</span></h3>
          
          <div class="form-group">
            <label class="form-label" for="breedSearch">Breed</label>
            <div class="breed-select-wrapper">
              <input id="breedSearch" class="form-input breed-search" type="text" aria-haspopup="listbox" aria-expanded="false" autocomplete="off" placeholder="Start typing to search..." />
              <div id="breedDropdown" class="breed-dropdown" role="listbox" style="display:none;">
                <ul id="breedList" class="breed-list"></ul>
              </div>
            </div>
            <div class="form-helper">List adapts to Cat/Dog from the previous step.</div>
          </div>

          <div id="customBreedGroup" class="form-group" style="display:none;">
            <label class="form-label" for="customBreedInput">Enter Breed Name</label>
            <input id="customBreedInput" class="form-input" type="text" placeholder="e.g., Mix, Rare breed name..." />
            <div class="form-helper">Please specify your pet's breed</div>
          </div>

          <div class="form-group">
            <label class="form-label">Is <span id="wizNameBreed2">your pet</span> brachycephalic (flat-faced)?</label>
            <div class="segmented-control" role="radiogroup" aria-label="Brachycephalic">
              <button type="button" class="segment-btn" data-field="brachycephalic" data-value="yes" aria-checked="false">Yes</button>
              <button type="button" class="segment-btn" data-field="brachycephalic" data-value="no" aria-checked="false">No</button>
            </div>
            <div class="form-helper helper-tip">💡 Flat-faced breeds (e.g., Pug, Bulldog) may need special feeding considerations.</div>
          </div>

          <div id="brachyWarning" class="brachy-indicator" style="display:none;">
            <div class="brachy-badge">
              <span class="brachy-icon">⚠️</span>
              <div class="brachy-text">
                <strong>Brachycephalic Breed Noted</strong>
                <p>We'll recommend feeding bowls and portion sizes suitable for flat-faced breeds.</p>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Size</label>
            <div class="button-group size-grid-extended" role="radiogroup" aria-label="Size">
              <button type="button" class="btn-choice" data-field="size" data-value="toy" role="radio" aria-checked="false">Toy</button>
              <button type="button" class="btn-choice" data-field="size" data-value="small" role="radio" aria-checked="false">Small</button>
              <button type="button" class="btn-choice" data-field="size" data-value="medium" role="radio" aria-checked="false">Medium</button>
              <button type="button" class="btn-choice" data-field="size" data-value="large" role="radio" aria-checked="false">Large</button>
              <button type="button" class="btn-choice" data-field="size" data-value="giant" role="radio" aria-checked="false">Giant</button>
            </div>
            <div id="sizeHelper" class="form-helper helper-tip" style="display:none;">💡 Size auto-set by breed</div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlide3() {
    return `
      <div class="wizard-slide" id="slide3" data-slide="3" style="display:none">
        <div class="wizard-slide-content">
          <h3 class="wizard-slide-title">Tell us about <span id="wizName3"></span></h3>
          
          <div class="form-group">
            <label class="form-label">How active is <span id="wizName3a"></span>?</label>
            <div class="button-group activity-grid" role="radiogroup" aria-label="Activity level">
              <button type="button" class="btn-choice" data-field="activity" data-value="mellow" role="radio" aria-checked="false">Mellow</button>
              <button type="button" class="btn-choice" data-field="activity" data-value="active" role="radio" aria-checked="false">Active</button>
              <button type="button" class="btn-choice" data-field="activity" data-value="very_active" role="radio" aria-checked="false">Very active</button>
              <button type="button" class="btn-choice" data-field="activity" data-value="athlete" role="radio" aria-checked="false">Athlete</button>
            </div>
            <div class="form-helper helper-tip">💡 If in between, choose the higher level to keep energy up.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Age group</label>
            <div class="segmented-control" role="radiogroup" aria-label="Age group">
              <button type="button" class="segment-btn" data-field="ageGroup" data-value="puppy_kitten" aria-checked="false">Puppy/Kitten</button>
              <button type="button" class="segment-btn" data-field="ageGroup" data-value="adult" aria-checked="false">Adult</button>
              <button type="button" class="segment-btn" data-field="ageGroup" data-value="senior" aria-checked="false">Senior</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlide4() {
    return `
      <div class="wizard-slide" id="slide4" data-slide="4" style="display:none">
        <div class="wizard-slide-content">
          <h3 class="wizard-slide-title">Next, we need info to calculate daily calories</h3>

          <div class="form-group">
            <label class="form-label" for="weightInput">Current weight</label>
            <div class="weight-input-group">
              <input id="weightInput" class="form-input" inputmode="decimal" placeholder="e.g., 4.5" />
              <select id="weightUnit" class="form-select" aria-label="Weight unit">
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="idealWeightInput">Ideal weight <span style="color: var(--wiz-muted); font-weight: 400; font-size: 13px;">(optional)</span></label>
            <input id="idealWeightInput" class="form-input" inputmode="decimal" placeholder="e.g., 4.0" />
            <div class="form-helper">Leave blank if your pet is at their ideal weight</div>
          </div>

          <div class="form-group">
            <label class="form-label">Is <span id="wizName4"></span> spayed/neutered?</label>
            <div class="segmented-control" role="radiogroup" aria-label="Neutered">
              <button type="button" class="segment-btn" data-field="neutered" data-value="yes" aria-checked="false">Yes</button>
              <button type="button" class="segment-btn" data-field="neutered" data-value="no" aria-checked="false">No</button>
            </div>
            <div class="form-helper helper-tip">💡 Spayed/neutered pets usually require fewer calories.</div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlide5() {
    return `
      <div class="wizard-slide" id="slide5" data-slide="5" style="display:none">
        <div class="wizard-slide-content">
          <h3 class="wizard-slide-title">Final details</h3>
          
          <div class="form-group">
            <label class="form-label">Allergies (optional)</label>
            <div class="chips-container field" id="allergiesField">
              <div class="tag-container" id="tagContainer"></div>
              <input id="allergiesInput" class="tag-input" placeholder="Type and press Enter..." />
            </div>
            <div class="form-helper helper-tip">💡 Common allergies: chicken, beef, fish, grain, dairy</div>
          </div>

          ${!this.isLoggedInUser() ? `
          <div class="form-group">
            <label class="form-label" for="phoneInput">Phone (WhatsApp) <span style="color: #DC2626;">*</span></label>
            <input id="phoneInput" class="form-input" type="tel" placeholder="12345678" required pattern="[0-9]{8}" minlength="8" maxlength="8" />
            <div class="form-helper">Enter your 8-digit Kuwait phone number (e.g., 12345678). +965 will be added automatically.</div>
            <div id="phoneError" class="field-error" style="display: none; color: #DC2626; font-size: 0.875rem; margin-top: 0.25rem;"></div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="emailInput">Email <span style="color: #DC2626;">*</span></label>
            <input id="emailInput" class="form-input" type="email" placeholder="your@email.com" required />
            <div class="form-helper">We'll use this to send you recommendations and updates.</div>
            <div id="emailError" class="field-error" style="display: none; color: #DC2626; font-size: 0.875rem; margin-top: 0.25rem;"></div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Check if current user is logged in
   */
  isLoggedInUser() {
    return typeof window.isLoggedIn === 'function' && window.isLoggedIn();
  }

  renderResultSlide() {
    return `
      <div class="wizard-slide wizard-result" id="slideResult" style="display: none;">
        <div class="wizard-slide-content">
          <div class="result-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="3"/>
              <path d="M20 32L28 40L44 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="result-title">Thank you!</h3>
          <div class="result-content" id="resultContent"></div>
          <button type="button" class="btn btn-primary" onclick="location.href='meal-plans.html'">View Meal Plans</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Navigation buttons
    const backBtn = document.getElementById('wizardBack');
    const nextBtn = document.getElementById('wizardNext');

    if (backBtn) backBtn.addEventListener('click', () => this.previousSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());

    // Close button
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('questionnaireModal');
        if (modal && modal.classList.contains('show')) {
          this.closeModal();
        }
      }
    });

    // Slide 1 listeners
    this.attachSlide1Listeners();
    
    // Slide 2 listeners
    this.attachSlide2Listeners();
    
    // Slide 3 listeners
    this.attachSlide3Listeners();
    
    // Slide 4 listeners
    this.attachSlide4Listeners();
    
    // Slide 5 listeners
    this.attachSlide5Listeners();

    // Initial validation
    this.validateCurrentSlide();
  }

  attachSlide1Listeners() {
    // Pet type buttons
    const petTypeButtons = document.querySelectorAll('[data-field="petType"]');
    
    // Pre-select pet type if exists
    if (this.formData.petType) {
      petTypeButtons.forEach(btn => {
        if (btn.dataset.value === this.formData.petType) {
          this.selectChoice(petTypeButtons, btn);
        }
      });
    }
    
    petTypeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const value = btn.dataset.value;
        this.selectChoice(petTypeButtons, btn);
        this.formData.petType = value;
        // Don't call updateBreedList here - it will be called when user focuses on breed input in Slide 2
        this.validateCurrentSlide();
      });
    });

    // Pet name input
    const nameInput = document.getElementById('nameInput');
    if (nameInput) {
      nameInput.value = this.formData.name || '';
      nameInput.addEventListener('input', (e) => {
        this.formData.name = e.target.value.trim();
        this.syncNameMirrors();
        this.validateCurrentSlide();
      });
    }
  }

  attachSlide2Listeners() {
    // Sync name in title
    this.syncNameMirrors();

    // Breed search input
    const breedSearch = document.getElementById('breedSearch');
    const breedDropdown = document.getElementById('breedDropdown');

    if (breedSearch && breedDropdown) {
      // Pre-fill breed if exists
      if (this.formData.breed) {
        breedSearch.value = this.formData.breed;
        // If custom breed, show the custom input
        if (this.formData.breed === 'Others...' && this.formData.customBreed) {
          const customBreedGroup = document.getElementById('customBreedGroup');
          const customBreedInput = document.getElementById('customBreedInput');
          if (customBreedGroup) customBreedGroup.style.display = 'block';
          if (customBreedInput) customBreedInput.value = this.formData.customBreed;
        }
      }
      
      // Ensure dropdown is hidden initially
      breedDropdown.style.display = 'none';
      breedSearch.setAttribute('aria-expanded', 'false');

      breedSearch.addEventListener('focus', () => {
          breedDropdown.style.display = 'block';
          breedSearch.setAttribute('aria-expanded', 'true');
        this.updateBreedList(breedSearch.value || '');
      });

      breedSearch.addEventListener('input', () => {
        breedDropdown.style.display = 'block';
        breedSearch.setAttribute('aria-expanded', 'true');
        this.updateBreedList(breedSearch.value || '');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!breedDropdown.contains(e.target) && e.target !== breedSearch) {
          breedDropdown.style.display = 'none';
          breedSearch.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Brachycephalic buttons
    const brachyBtns = document.querySelectorAll('[data-field="brachycephalic"]');
    
    // Pre-select brachycephalic if exists
    if (this.formData.brachycephalic !== undefined) {
      brachyBtns.forEach(btn => {
        if ((btn.dataset.value === 'yes' && this.formData.brachycephalic) ||
            (btn.dataset.value === 'no' && !this.formData.brachycephalic)) {
          this.selectChoice(brachyBtns, btn);
        }
      });
      
      // Show/hide warning
      const brachyWarning = document.getElementById('brachyWarning');
      if (brachyWarning) {
        brachyWarning.style.display = this.formData.brachycephalic ? 'block' : 'none';
      }
    }
    
    brachyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectChoice(brachyBtns, btn);
        this.formData.brachycephalic = btn.dataset.value === 'yes';
        
        // Show/hide warning
        const brachyWarning = document.getElementById('brachyWarning');
        if (brachyWarning) {
          brachyWarning.style.display = this.formData.brachycephalic ? 'block' : 'none';
        }
        
        this.validateCurrentSlide();
      });
      });

    // Size buttons
    const sizeBtns = document.querySelectorAll('.size-grid-extended [data-field="size"]');
    
    // Pre-select size if exists
    if (this.formData.size) {
      sizeBtns.forEach(btn => {
        if (btn.dataset.value === this.formData.size && !btn.disabled) {
          this.selectChoice(sizeBtns, btn);
        }
      });
    }
    
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.selectChoice(sizeBtns, btn);
          this.formData.size = btn.dataset.value;
          this.validateCurrentSlide();
      });
    });

    // Custom breed input (shown when "Others..." is selected)
    const customBreedInput = document.getElementById('customBreedInput');
    if (customBreedInput) {
      customBreedInput.value = this.formData.customBreed || '';
      customBreedInput.addEventListener('input', (e) => {
        this.formData.customBreed = e.target.value.trim();
        this.validateCurrentSlide();
      });
    }
  }

  attachSlide3Listeners() {
    // Sync name in title
    this.syncNameMirrors();

    // Activity buttons
    const activityButtons = document.querySelectorAll('[data-field="activity"]');
    
    // Pre-select activity if exists
    if (this.formData.activity) {
      activityButtons.forEach(btn => {
        if (btn.dataset.value === this.formData.activity) {
          this.selectChoice(activityButtons, btn);
        }
      });
    }
    
    activityButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectChoice(activityButtons, btn);
        this.formData.activity = btn.dataset.value;
        this.validateCurrentSlide();
      });
    });

    // Age group buttons
    const ageGroupButtons = document.querySelectorAll('[data-field="ageGroup"]');
    
    // Pre-select age group if exists
    if (this.formData.ageGroup) {
      ageGroupButtons.forEach(btn => {
        if (btn.dataset.value === this.formData.ageGroup) {
          this.selectChoice(ageGroupButtons, btn);
        }
      });
    }
    
    ageGroupButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectChoice(ageGroupButtons, btn);
        this.formData.ageGroup = btn.dataset.value;
        this.validateCurrentSlide();
      });
    });
  }

  attachSlide4Listeners() {
    // Sync name in title
    this.syncNameMirrors();
    
    // Weight input
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
      weightInput.value = this.formData.weightValue || '';
      weightInput.addEventListener('input', (e) => {
        this.formData.weightValue = e.target.value.trim();
        this.validateCurrentSlide();
      });
    }

    // Weight unit selector
    const weightUnit = document.getElementById('weightUnit');
    if (weightUnit) {
      weightUnit.value = this.formData.weightUnit || 'kg';
      weightUnit.addEventListener('change', (e) => {
        this.formData.weightUnit = e.target.value;
        this.validateCurrentSlide();
      });
    }

    // Ideal weight input
    const idealWeightInput = document.getElementById('idealWeightInput');
    if (idealWeightInput) {
      idealWeightInput.value = this.formData.idealWeightValue || '';
      idealWeightInput.addEventListener('input', (e) => {
        this.formData.idealWeightValue = e.target.value.trim();
      });
    }

    // Neutered buttons
    const neuteredButtons = document.querySelectorAll('[data-field="neutered"]');
    
    // Pre-select neutered if exists
    if (this.formData.neutered) {
      neuteredButtons.forEach(btn => {
        if (btn.dataset.value === this.formData.neutered) {
          this.selectChoice(neuteredButtons, btn);
        }
      });
    }
    
    neuteredButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectChoice(neuteredButtons, btn);
        this.formData.neutered = btn.dataset.value;
        this.validateCurrentSlide();
      });
    });
  }

  attachSlide5Listeners() {
    // Allergies tag input
    const allergiesInput = document.getElementById('allergiesInput');
    if (allergiesInput) {
      allergiesInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const value = allergiesInput.value.trim();
          if (value) {
            this.addAllergyTag(value);
            allergiesInput.value = '';
          }
        }
      });
    }

    // Pre-populate existing allergies
    if (this.formData.allergies && Array.isArray(this.formData.allergies) && this.formData.allergies.length > 0) {
      this.formData.allergies.forEach(allergy => {
        if (allergy) {
          this.addAllergyTag(allergy);
        }
      });
    }

    // Phone input
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
      phoneInput.value = this.formData.phone || '';
      phoneInput.addEventListener('input', (e) => {
        this.formData.phone = e.target.value.trim();
        this.validateCurrentSlide();
        // Clear error on input
        const phoneError = document.getElementById('phoneError');
        if (phoneError) {
          phoneError.style.display = 'none';
        }
      });
    }
    
    // Email input (only for non-logged-in users)
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
      // If user is logged in, get email from account
      if (this.isLoggedInUser()) {
        const user = window.getCurrentUser ? window.getCurrentUser() : null;
        if (user && user.email) {
          this.formData.email = user.email;
          emailInput.value = user.email;
          emailInput.disabled = true;
        }
      } else {
        emailInput.value = this.formData.email || '';
        emailInput.addEventListener('input', (e) => {
          this.formData.email = e.target.value.trim();
          this.validateCurrentSlide();
          // Clear error on input
          const emailError = document.getElementById('emailError');
          if (emailError) {
            emailError.style.display = 'none';
          }
        });
      }
    }
  }

  updatePetNameDisplays() {
    const displays = [
      'petNameDisplay', 'petNameDisplay2', 'petNameDisplay3',
      'petNameDisplay4', 'petNameDisplay5'
    ];
    
    displays.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = this.formData.name || (id.includes('2') || id.includes('3') || id.includes('5') ? 'their' : 'your pet');
      }
    });

    // Update age options based on pet type
    const ageSelect = document.getElementById('petAge');
    if (ageSelect && this.formData.petType) {
      const catOptions = ageSelect.querySelectorAll('.cat-only');
      const dogOptions = ageSelect.querySelectorAll('.dog-only');
      
      catOptions.forEach(opt => opt.style.display = this.formData.petType === 'cat' ? 'block' : 'none');
      dogOptions.forEach(opt => opt.style.display = this.formData.petType === 'dog' ? 'block' : 'none');
    }
  }

  updateBreedList(filter) {
    const breedList = document.getElementById('breedList');
    if (!breedList) return;

    const breeds = this.formData.petType === 'cat' ? CAT_BREEDS : DOG_BREEDS;
    
    // Filter breeds (exclude "Others..." from initial filter)
    const filtered = breeds
      .filter(breed => breed !== "Others...")
      .filter(breed => breed.toLowerCase().includes(filter.toLowerCase()));

    // Always add "Others..." at the end
    // If no matches found, highlight it more prominently
    const showOthersProminent = filtered.length === 0 && filter.trim().length > 0;
    
    let html = filtered.map(breed => {
      const safe = escapeHtml(breed);
      return `
        <li class="breed-item" tabindex="0" role="option" data-breed="${safe}">
          ${safe}
      </li>
      `;
    }).join('');
    
    // Add separator and "Others..." option
    if (filtered.length > 0) {
      html += '<li class="breed-separator" style="border-top: 1px solid #E9DECE; margin: 8px 0; pointer-events: none;"></li>';
    }
    
    // Add "Others..." with optional highlighting
    const othersClass = showOthersProminent ? 'breed-item breed-item-prominent' : 'breed-item';
    const othersLabel = showOthersProminent 
      ? '✨ Others... (Enter custom breed)' 
      : 'Others...';
    
    html += `
      <li class="${othersClass}" tabindex="0" role="option" data-breed="Others..." style="${showOthersProminent ? 'background: #FFF8E7; font-weight: 600;' : ''}">
        ${othersLabel}
      </li>
    `;
    
    breedList.innerHTML = html;

    // Add click listeners
    breedList.querySelectorAll('.breed-item').forEach(item => {
      item.addEventListener('click', () => this.selectBreed(item.dataset.breed));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectBreed(item.dataset.breed);
        }
      });
    });
  }

  selectBreed(breed) {
    this.formData.breed = breed;
    const breedSearch = document.getElementById('breedSearch');
    const breedDropdown = document.getElementById('breedDropdown');
    const customBreedGroup = document.getElementById('customBreedGroup');
    const customBreedInput = document.getElementById('customBreedInput');
    
    if (breedSearch) breedSearch.value = breed;
    
    // Close dropdown after selection
    if (breedDropdown) {
      breedDropdown.style.display = 'none';
      if (breedSearch) breedSearch.setAttribute('aria-expanded', 'false');
    }

    // Show/hide custom breed input field
    if (breed === "Others...") {
      // Show custom breed input
      if (customBreedGroup) customBreedGroup.style.display = 'block';
      if (customBreedInput) {
        customBreedInput.value = this.formData.customBreed || '';
        customBreedInput.focus(); // Auto-focus for better UX
      }
    } else {
      // Hide custom breed input and clear it
      if (customBreedGroup) customBreedGroup.style.display = 'none';
      this.formData.customBreed = '';
      if (customBreedInput) customBreedInput.value = '';
    }

    // Get breed data (for dogs only)
    const breedData = this.formData.petType === 'dog' ? DOG_BREED_DATA[breed] : null;
    
    // Auto-suggest brachycephalic status based on breed data
    const brachyBtns = document.querySelectorAll('[data-field="brachycephalic"]');
    if (breedData && breedData.brachy) {
      // Suggest "Yes" for known brachycephalic breeds
      brachyBtns.forEach(btn => {
        if (btn.dataset.value === 'yes') {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
          this.formData.brachycephalic = true;
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        }
      });
      
      // Show warning
      const brachyWarning = document.getElementById('brachyWarning');
      if (brachyWarning) brachyWarning.style.display = 'block';
    } else {
      // Suggest "No" for non-brachycephalic breeds
      brachyBtns.forEach(btn => {
        if (btn.dataset.value === 'no') {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
          this.formData.brachycephalic = false;
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        }
      });
      
      // Hide warning
      const brachyWarning = document.getElementById('brachyWarning');
      if (brachyWarning) brachyWarning.style.display = 'none';
    }

    // Auto-set size based on breed data - ONLY target size buttons in slide 2
    const sizeButtons = document.querySelectorAll('#slide2 .size-grid-extended [data-field="size"]');
    const sizeHelper = document.getElementById('sizeHelper');
    
    // Check if breed is "Others..." (unlocked size)
    const isOthersBreed = breed === "Others...";
    
    if (breedData && breedData.size) {
      // Dog breed with size data
      const autoSize = breedData.size;
      this.formData.size = autoSize;
      
      // Disable and lock size buttons
      sizeButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('active');
        if (btn.dataset.value === autoSize) {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
        } else {
          btn.setAttribute('aria-checked', 'false');
        }
      });
      
      if (sizeHelper) {
        sizeHelper.style.display = 'block';
      }
    } else if (this.formData.petType === 'cat' && !isOthersBreed) {
      // For cats, default to medium (except "Others...")
      const autoSize = 'medium';
      this.formData.size = autoSize;
      
      // Lock to medium for cats
      sizeButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('active');
        if (btn.dataset.value === autoSize) {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
    } else {
          btn.setAttribute('aria-checked', 'false');
        }
      });
      
      if (sizeHelper) {
        sizeHelper.style.display = 'block';
      }
    } else {
      // Enable size buttons for manual selection (unmapped breeds or "Others...")
      sizeButtons.forEach(btn => {
        btn.disabled = false;
        // Preserve existing selection if any
        if (this.formData.size && btn.dataset.value === this.formData.size) {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        }
      });
      if (sizeHelper) {
        sizeHelper.style.display = 'none';
      }
    }

    this.validateCurrentSlide();
  }

  addAllergyTag(value) {
    if (!this.formData.allergies.includes(value)) {
      this.formData.allergies.push(value);
      this.renderAllergyTags();
    }
  }

  removeAllergyTag(value) {
    this.formData.allergies = this.formData.allergies.filter(a => a !== value);
    this.renderAllergyTags();
  }

  renderAllergyTags() {
    const tagContainer = document.getElementById('tagContainer');
    if (!tagContainer) return;

    tagContainer.innerHTML = this.formData.allergies.map(allergy => {
      const safe = escapeHtml(allergy);
      return `
      <span class="tag">
          ${safe}
          <button type="button" class="tag-remove" data-allergy="${safe}" aria-label="Remove ${safe}">×</button>
      </span>
      `;
    }).join('');

    // Add remove listeners
    tagContainer.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => this.removeAllergyTag(btn.dataset.allergy));
    });
  }

  selectChoice(buttons, selected) {
    buttons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    });
    selected.classList.add('active');
    selected.setAttribute('aria-checked', 'true');
  }

  syncNameMirrors() {
    const name = this.formData.name || 'your pet';
    const mirrors = ['wizNameBreed', 'wizNameBreed2', 'wizName3', 'wizName3a', 'wizName4'];
    mirrors.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = name;
    });
  }

  validateCurrentSlide() {
    const nextBtn = document.getElementById('wizardNext');
    if (!nextBtn) return;

    let isValid = false;
    switch (this.currentSlide) {
      case 1:
        // Pet Type + Name
        isValid = !!this.formData.petType && !!this.formData.name;
        break;
      case 2:
        // Breed + Brachycephalic + Size
        // If "Others..." is selected, also require customBreed to be filled
        const hasBrachySelection = this.formData.brachycephalic === true || this.formData.brachycephalic === false;
        const hasValidBreed = this.formData.breed && 
          (this.formData.breed !== "Others..." || !!this.formData.customBreed);
        isValid = hasValidBreed && hasBrachySelection && !!this.formData.size;
        break;
      case 3:
        // Activity + Age
        isValid = !!this.formData.activity && !!this.formData.ageGroup;
        break;
      case 4: {
        // Weight + Neutered
        const w = parseFloat(this.formData.weightValue);
        const okWeight = !Number.isNaN(w) && w > 0 && !!this.formData.weightUnit;
        const okNeuter = this.formData.neutered === 'yes' || this.formData.neutered === 'no';
        isValid = okWeight && okNeuter;
        break;
      }
      case 5:
        // Contact + Allergies
        let phoneValid = true;
        let emailValid = true;
        
        // Phone and email are only required for non-logged-in users
        if (!this.isLoggedInUser()) {
          phoneValid = this.validatePhone(this.formData.phone);
          emailValid = this.validateEmail(this.formData.email);
        } else {
          // For logged-in users, get email from account
          const user = window.getCurrentUser ? window.getCurrentUser() : null;
          if (user && user.email) {
            this.formData.email = user.email;
          }
          // Phone is optional for logged-in users - try to get from existing questionnaire if available
          // but don't require it
        }
        
        isValid = phoneValid && emailValid;
        break;
      default:
        isValid = false;
    }
    nextBtn.disabled = !isValid;
  }

  validatePhone(phone) {
    // Kuwait phone number validation: 8 digits
    const cleanPhone = phone.replace(/[\s\-()]/g, ''); // Remove spaces, dashes, parentheses
    const phoneRegex = /^[0-9]{8}$/; // Exactly 8 digits for Kuwait local number
    const isValid = phoneRegex.test(cleanPhone);
    
    // Show error if invalid
    const phoneError = document.getElementById('phoneError');
    if (phoneError) {
      if (!isValid && cleanPhone) {
        phoneError.textContent = 'Must be exactly 8 digits';
        phoneError.style.display = 'block';
      } else if (!cleanPhone) {
        phoneError.textContent = 'Phone number is required';
        phoneError.style.display = 'block';
      } else {
        phoneError.style.display = 'none';
      }
    }
    
    return isValid;
  }
  
  validateEmail(email) {
    // Email validation
    if (!email || email.trim() === '') {
      const emailError = document.getElementById('emailError');
      if (emailError) {
        emailError.textContent = 'Email is required';
        emailError.style.display = 'block';
      }
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email.trim());
    
    // Show error if invalid
    const emailError = document.getElementById('emailError');
    if (emailError) {
      if (!isValid) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.display = 'block';
      } else {
        emailError.style.display = 'none';
      }
    }
    
    return isValid;
  }

  nextSlide() {
    if (this.currentSlide < this.totalSlides) {
      this.currentSlide++;
      this.showSlide(this.currentSlide);
    } else if (this.currentSlide === this.totalSlides) {
      this.submitQuestionnaire();
    }
  }

  previousSlide() {
    if (this.currentSlide > 1) {
      this.currentSlide--;
      this.showSlide(this.currentSlide);
    }
  }

  showSlide(slideNumber) {
    // Hide all slides
    document.querySelectorAll('.wizard-slide').forEach(slide => {
      slide.style.display = 'none';
    });

    // Show current slide
    const currentSlideEl = document.getElementById(`slide${slideNumber}`);
    if (currentSlideEl) {
      currentSlideEl.style.display = 'block';
    }

    // Update progress
    const currentStep = document.getElementById('currentStep');
    const progressFill = document.getElementById('progressFill');
    const backBtn = document.getElementById('wizardBack');
    const nextBtn = document.getElementById('wizardNext');

    if (currentStep) currentStep.textContent = slideNumber;
    if (progressFill) {
      const percentage = (slideNumber / this.totalSlides) * 100;
      progressFill.style.width = `${percentage}%`;
    }

    // Update buttons
    if (backBtn) backBtn.disabled = slideNumber === 1;
    
    if (nextBtn) {
      nextBtn.textContent = slideNumber === this.totalSlides ? 'Submit' : 'Next';
    }

    // Ensure breed dropdown is closed when showing Slide 2
    if (slideNumber === 2) {
      const breedDropdown = document.getElementById('breedDropdown');
      const breedSearch = document.getElementById('breedSearch');
      if (breedDropdown) {
        breedDropdown.style.display = 'none';
      }
      if (breedSearch) {
        breedSearch.setAttribute('aria-expanded', 'false');
      }
    }

    // Validate
    this.validateCurrentSlide();

    // Don't auto-focus inputs (can be annoying and causes dropdown to open unintentionally)
  }

  async submitQuestionnaire() {
    // Show loading state
    const nextBtn = document.getElementById('wizardNext');
    if (nextBtn) {
      nextBtn.classList.add('loading');
      nextBtn.disabled = true;
      nextBtn.textContent = 'Processing...';
    }

    try {
      // Generate recommendation
      const recommendation = this.generateRecommendation();
      this.formData.recommendation = recommendation.meal;
      this.formData.recommendationData = recommendation;

      // Ensure email is captured
      const isLoggedIn = typeof window.isLoggedIn === 'function' && window.isLoggedIn();
      
      if (isLoggedIn) {
        // Get email from logged-in user's account
        const user = window.getCurrentUser ? window.getCurrentUser() : null;
        if (user && user.email) {
          this.formData.email = user.email;
        }
      } else {
        // For non-logged-in users, email should already be in formData from slide 5
        if (!this.formData.email || this.formData.email.trim() === '') {
          alert('Email is required. Please enter your email address.');
          this.showSlide(5);
          const emailInput = document.getElementById('emailInput');
          if (emailInput) emailInput.focus();
          return;
        }
      }
      
      // Validate phone is present (only for non-logged-in users)
      if (!isLoggedIn) {
      if (!this.formData.phone || !this.validatePhone(this.formData.phone)) {
        alert('Please enter a valid phone number.');
        this.showSlide(5);
        const phoneInput = document.getElementById('phoneInput');
        if (phoneInput) phoneInput.focus();
        return;
        }
      }
      
      if (isLoggedIn) {
        // User is logged in - save to backend
        await this.saveQuestionnaireToBackend();
        this.showResult(recommendation);
      } else {
        // User is not logged in - prompt to login
        this.promptLoginBeforeSubmit(recommendation);
        return; // Don't show result yet
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('Error saving questionnaire. Please try again.');
    } finally {
      // Remove loading state
      if (nextBtn) {
        nextBtn.classList.remove('loading');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Get My Recommendation';
      }
    }
  }

  async saveQuestionnaireToBackend() {
    // Check APIs are available
    if (typeof window.accountAPI === 'undefined') {
      throw new Error('Account API not available');
    }
    
    if (typeof window.petsAPI === 'undefined') {
      throw new Error('Pets API not available');
    }

    // Step 1: Prepare Pet data and create/update Pet record
    const petData = this.mapQuestionnaireToPetData();
    let pet;
    
    try {
      // Log state before save for debugging
      console.log('💾 Save Pet - State Check:', {
        currentPetId: this.currentPetId,
        isEditMode: this.isEditMode,
        hasExistingData: this.hasExistingData,
        petName: this.formData?.name
      });
      
      if (this.currentPetId && this.isEditMode) {
        // Update existing pet
        console.log('📝 Updating existing pet:', this.currentPetId);
        pet = await window.petsAPI.update(this.currentPetId, petData);
        console.log('✅ Pet updated successfully:', pet);
      } else {
        // Create new pet
        console.log('🐾 Creating new pet (edit mode was false or no pet ID)...');
        console.log('   State:', { currentPetId: this.currentPetId, isEditMode: this.isEditMode });
        pet = await window.petsAPI.create(petData);
        console.log('✅ Pet created successfully:', pet);
        this.currentPetId = pet.id;
        this.hasExistingData = true;
        this.isEditMode = true;
      }
    } catch (error) {
      console.error('❌ Error saving pet:', error);
      throw new Error(`Failed to save pet: ${error.message || 'Unknown error'}`);
    }

    // Step 2: Also save questionnaire JSON for backward compatibility and recommendations
    const questionnaireData = {
      pet_type: this.formData.petType,
      pet_name: this.formData.name,
      breed: this.formData.breed,
      custom_breed: this.formData.customBreed || null,
      size: this.formData.size,
      brachycephalic: this.formData.brachycephalic,
      activity: this.formData.activity,
      age_group: this.formData.ageGroup,
      weight_value: this.formData.weightValue,
      weight_unit: this.formData.weightUnit,
      ideal_weight_value: this.formData.idealWeightValue || null,
      neutered: this.formData.neutered,
      allergies: this.formData.allergies,
      phone: this.formData.phone || null,
      email: this.formData.email || null,
      recommendation: this.formData.recommendation,
      recommendation_data: this.formData.recommendationData,
      pet_id: pet.id // Link questionnaire to pet ID
    };

    try {
      if (this.isEditMode && this.hasExistingData) {
        // Update existing questionnaire JSON
        await window.accountAPI.saveQuestionnaire(questionnaireData);
        console.log('✅ Questionnaire JSON updated successfully');
      } else {
        // Create new questionnaire JSON
        await window.accountAPI.createQuestionnaire(questionnaireData);
        console.log('✅ Questionnaire JSON saved successfully');
      }
    } catch (error) {
      console.warn('⚠️ Warning: Pet saved but questionnaire JSON save failed:', error);
      // Don't throw - pet is the source of truth, questionnaire JSON is just for compatibility
    }
    
    // Step 3: If we're on the account page, close modal and refresh after a short delay
    const isAccountPage = window.location.pathname.includes('account.html');
    if (isAccountPage && typeof window.loadAccountData === 'function') {
      console.log('🔄 Pet saved from account page - will close modal and refresh...');
      // Use setTimeout to allow the result screen to show briefly, then close and refresh
      setTimeout(() => {
        if (typeof window.closeQuestionnaireModal === 'function') {
          window.closeQuestionnaireModal();
        }
        // Refresh account data
        window.loadAccountData();
      }, 2000); // 2 second delay to show success message
    }
    
    // Step 4: Return the pet object for further use
    return pet;
  }

  promptLoginBeforeSubmit(recommendation) {
    // Store data temporarily
    this.pendingData = {
      formData: { ...this.formData },
      recommendation: recommendation
    };

    // Show login prompt
    const shouldLogin = confirm(
      'To save your questionnaire and get personalized recommendations, please log in or create an account.\n\n' +
      'Would you like to log in now?'
    );

    if (shouldLogin) {
      // Redirect to login with return URL
      const currentUrl = window.location.href;
      window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}&questionnaire=pending`;
    } else {
      // User chose not to login - show result anyway but don't save
      this.showResult(recommendation);
      console.log('Questionnaire completed but not saved (user not logged in)');
    }
  }

  async handlePostLoginSubmission() {
    // Check if there's pending data after login
    if (this.pendingData && typeof window.isLoggedIn === 'function' && window.isLoggedIn()) {
      // Restore form data
      this.formData = { ...this.pendingData.formData };
      
      // Save to backend
      try {
        await this.saveQuestionnaireToBackend();
        this.showResult(this.pendingData.recommendation);
        this.pendingData = null;
        console.log('✅ Pending questionnaire saved after login');
      } catch (error) {
        console.error('Error saving pending questionnaire:', error);
      }
    }
  }

  generateRecommendation() {
    const { petType, activity, ageGroup, neutered, allergies } = this.formData;

    // Convert weight to kg
    const wVal = parseFloat(this.formData.weightValue);
    const weightKg = this.formData.weightUnit === 'lb' ? (wVal * 0.45359237) : wVal;

    const idealVal = parseFloat(this.formData.idealWeightValue);
    const hasIdeal = !Number.isNaN(idealVal) && idealVal > 0;
    const idealKg = hasIdeal
      ? (this.formData.weightUnit === 'lb' ? (idealVal * 0.45359237) : idealVal)
      : null;

    // --- 1) RER ---
    const RER = 70 * Math.pow(weightKg, 0.75); // Resting Energy Requirement

    // --- 2) Activity / age multipliers (MER) ---
    // Baselines
    let merMult;
    if (ageGroup === 'puppy_kitten') {
      merMult = petType === 'dog' ? 2.5 : 2.5; // kittens/puppies ~2–3× RER
    } else if (activity === 'mellow') {
      merMult = 1.2;
    } else if (activity === 'active') {
      merMult = 1.6;
    } else if (activity === 'very_active') {
      merMult = 2.2;
    } else if (activity === 'athlete') {
      merMult = 3.0;
    } else {
      merMult = 1.6; // default adult
    }

    // Neuter adjustment
    if (neutered === 'yes' && ageGroup !== 'puppy_kitten') {
      merMult -= 0.1; // small conservative reduction
    }

    // Weight management adjustment if ideal provided
    if (hasIdeal) {
      if (idealKg < weightKg * 0.95) {
        // needs weight loss: lower MER target
        merMult = Math.max(1.0, merMult - 0.4);
      } else if (idealKg > weightKg * 1.05) {
        // needs weight gain: increase MER target
        merMult = merMult + 0.3;
      }
    }

    const MER = RER * merMult;

    // --- 3) Map MER & answers to recipe buckets ---
    // Default order: chicken → beef → fish (we'll filter by allergies & pet type context)
    const RECIPES = [
      { id: 'chicken', label: petType === 'cat' ? 'Chicken Hearts, Liver & Rice' : 'Chicken & Brown Rice' },
      { id: 'beef',    label: 'Beef Hearts, Liver & Sweet Potato' },
      { id: 'fish',    label: 'White Fish & Quinoa' }
    ];

    // Allergy filter
    const blocked = new Set();
    (allergies || []).forEach(a => {
      const key = String(a).toLowerCase();
      if (key.includes('chicken')) blocked.add('chicken');
      if (key.includes('beef')) blocked.add('beef');
      if (key.includes('fish')) blocked.add('fish');
    });

    // MER thresholds (tunable)
    // Low demand → fish; mid → chicken; high → beef
    // Compare as multiplier to RER to make weight-independent.
    const merRatio = MER / RER;
    let preferred = 'chicken'; // middle
    if (merRatio < 1.5 || activity === 'mellow' || ageGroup === 'puppy_kitten') {
      preferred = 'fish';
    } else if (merRatio >= 2.4 || activity === 'very_active' || activity === 'athlete') {
      preferred = 'beef';
    }

    // Pick first unblocked in priority [preferred, chicken, beef, fish]
    const order = [preferred, 'chicken', 'beef', 'fish'];
    const chosenId = order.find(id => !blocked.has(id)) || 'chicken';
    const chosen = RECIPES.find(r => r.id === chosenId);

    const reasons = {
      fish: 'Easily digestible with gentle nutrition—great for young pets or lower activity levels.',
      chicken: 'Balanced, complete nutrition for everyday health and steady energy.',
      beef: 'High-energy recipe to support active muscles and stamina.'
      };

    // ========== Calculate Daily Feeding Amount ==========
    // 3A) Convert MER (kcal/day) → grams/day via kcal/g of chosen recipe
    const kcalPerGram = KCAL_PER_GRAM[chosenId] ?? 1.30; // fallback if missing
    let gramsPerDay = MER / kcalPerGram;

    // 3B) Clamp & round grams
    gramsPerDay = clamp(gramsPerDay, MIN_GRAMS, MAX_GRAMS);
    gramsPerDay = roundTo(gramsPerDay, GRAM_ROUND); // nearest 10 g

    // 3C) Convert grams → pouches (120 g each), rounded to nearest 0.5
    let pouchesPerDay = gramsPerDay / POUCH_GRAMS;
    pouchesPerDay = Math.max(0.5, Math.round(pouchesPerDay / POUCH_ROUND) * POUCH_ROUND);

    // 3D) Choose meals per day based on age
    const meals = MEALS_PER_DAY[ageGroup] ?? 2;

    // 3E) Calculate grams per meal
    const gramsPerMeal = roundTo(gramsPerDay / meals, GRAM_ROUND);

    return {
      meal: chosen.label,
      reason: reasons[chosenId],
      recipeId: chosenId,
      daily: {
        grams: gramsPerDay,          // e.g., 300
        pouches: pouchesPerDay,      // e.g., 2.5
        pouchSize: POUCH_GRAMS,      // 120 g
        mealsPerDay: meals,          // e.g., 2 or 3
        gramsPerMeal: gramsPerMeal   // e.g., 150 (if 2 meals)
      }
    };
  }

  showResult(recommendation) {
    // Check if we're on the account page
    const isAccountPage = window.location.pathname.includes('account.html');
    
    // Hide all slides and navigation
    document.querySelectorAll('.wizard-slide').forEach(slide => {
      slide.style.display = 'none';
    });

    const resultSlide = document.getElementById('slideResult');
    const resultContent = document.getElementById('resultContent');
    const wizardActions = document.querySelector('.wizard-actions');
    const wizardProgress = document.querySelector('.wizard-progress');

    if (resultSlide) resultSlide.style.display = 'block';
    if (wizardActions) wizardActions.style.display = 'none';
    if (wizardProgress) wizardProgress.style.display = 'none';

    if (resultContent) {
      const safeName = escapeHtml(this.formData.name);
      const safePhone = escapeHtml(this.formData.phone);
      
      // Format feeding metrics
      const grams = recommendation.daily.grams.toLocaleString();
      const pouches = recommendation.daily.pouches.toFixed(1).replace('.0','');
      const meals = recommendation.daily.mealsPerDay;
      const gramsPerMeal = recommendation.daily.gramsPerMeal.toLocaleString();
      
      // Different display for account page vs main questionnaire
      if (isAccountPage) {
        // Simplified success message for account page
        resultContent.innerHTML = `
          <div style="text-align: center; padding: 2rem 0;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <p class="result-subtitle" style="font-size: 1.5rem; margin-bottom: 0.5rem;">
              <strong>${safeName}</strong> has been added!
            </p>
            <p class="result-description" style="margin-bottom: 1.5rem;">
              We suggest <strong>${recommendation.meal}</strong> for ${safeName}.
            </p>
            <div class="rec-panel" style="margin: 1.5rem auto; max-width: 400px;">
              <div class="rec-row">
                <div class="rec-metric">
                  <div class="metric-value">${grams} g</div>
                  <div class="metric-label">Daily Amount</div>
                </div>
                <div class="rec-metric">
                  <div class="metric-value">${pouches} × ${recommendation.daily.pouchSize}g</div>
                  <div class="metric-label">Pouches per day</div>
                </div>
              </div>
            </div>
            <p style="color: var(--ink-600); font-size: 0.9rem; margin-top: 1.5rem;">
              Closing in a moment...
            </p>
          </div>
        `;
      } else {
        // Full result display for main questionnaire flow
        resultContent.innerHTML = `
          <p class="result-subtitle">We suggest <strong>${recommendation.meal}</strong> for ${safeName}.</p>
          <p class="result-description">${recommendation.reason}</p>
          
          <div class="rec-panel">
            <div class="rec-row">
              <div class="rec-metric">
                <div class="metric-value">${grams} g</div>
                <div class="metric-label">Daily Amount</div>
              </div>
              <div class="rec-metric">
                <div class="metric-value">${pouches} × ${recommendation.daily.pouchSize}g</div>
                <div class="metric-label">Pouches per day</div>
              </div>
            </div>
            <div class="rec-row">
              <div class="rec-metric">
                <div class="metric-value">${gramsPerMeal} g</div>
                <div class="metric-label">Per meal</div>
              </div>
              <div class="rec-metric">
                <div class="metric-value">${meals}</div>
                <div class="metric-label">Meals per day</div>
              </div>
            </div>
            <p class="rec-hint">Tip: split evenly across ${meals} meal${meals>1?'s':''}.</p>
          </div>
          
          ${safePhone ? `<p class="result-whatsapp">You will be contacted soon via WhatsApp at <strong>${safePhone}</strong>.</p>` : ''}
          <div class="result-actions">
            <button type="button" class="btn btn-primary" id="buildSubscriptionBtn">
              Build My Subscription
            </button>
          </div>
        `;
      }
    }

    this.setupResultActions();

    // Set as seen
    localStorage.setItem('pkq_seen', Date.now().toString());
    
    // Save to global for Instructions page
    window.petRec = {
      name: this.formData.name,
      petType: this.formData.petType,
      meal: recommendation.meal,
      daily: recommendation.daily
    };
    
    // Send email notification via EmailJS
    if (typeof sendQuestionnaireEmail === 'function') {
      sendQuestionnaireEmail(this.formData, recommendation)
        .then(result => {
          if (result.success) {
            console.log('✅ Questionnaire submitted successfully via email');
          } else {
            console.warn('⚠️ Email sending failed, but questionnaire completed');
          }
        })
        .catch(err => {
          console.error('❌ Error sending email:', err);
        });
    }

    // Save pet to database if user is logged in
    this.savePetToDatabase(recommendation);
  }

  async savePetToDatabase(recommendation) {
    // Check if user is logged in
    if (!window.getToken || !window.getToken()) {
      console.log('ℹ️ User not logged in, skipping pet save to database');
      return;
    }

    // Check if petsAPI is available
    if (!window.petsAPI || !window.petsAPI.create) {
      console.warn('⚠️ Pets API not available. Make sure api.js is loaded.');
      return;
    }

    try {
      console.log('💾 Attempting to save pet to database...');
      console.log('Form data:', this.formData);

      // Convert weight to kg
      const weightValue = parseFloat(this.formData.weightValue);
      const weightKg = this.formData.weightUnit === 'lb' 
        ? weightValue * 0.45359237 
        : weightValue;

      // Map questionnaire data to pet API format
      const ageGroup = this.formData.ageGroup;
      let mappedAgeGroup = null;
      if (ageGroup === 'puppy_kitten') {
        // Map puppy_kitten to puppy (dog) or kitten (cat)
        mappedAgeGroup = this.formData.petType === 'dog' ? 'puppy' : 'kitten';
      } else if (ageGroup && ['adult', 'senior'].includes(ageGroup)) {
        mappedAgeGroup = ageGroup;
      }

      // Ensure name is not empty (required by API)
      const petName = (this.formData.name && this.formData.name.trim()) || 'My Pet';
      
      const petData = {
        name: petName,
        type: this.formData.petType || 'dog',
        breed: (this.formData.breed === 'Others...' && this.formData.customBreed) 
          ? this.formData.customBreed.trim() 
          : (this.formData.breed || null),
        weight_kg: !isNaN(weightKg) && weightKg > 0 ? parseFloat(weightKg.toFixed(2)) : null,
        age_group: mappedAgeGroup,
        activity_level: this.mapActivityForSubscriptions() || null,
        goal: 'maintain' // Default, can be updated later
      };

      // Validate required fields
      if (!petData.name || !petData.type) {
        console.error('❌ Missing required fields: name or type');
        return;
      }

      console.log('📤 Sending pet data to API:', petData);

      // Save pet to database
      const savedPet = await window.petsAPI.create(petData);
      console.log('✅ Pet saved to database successfully:', savedPet);
      
      // Show success message
      if (savedPet && savedPet.id) {
        console.log(`🎉 Pet "${petData.name}" has been added to your account!`);
        
        // Show a visual notification
        this.showPetSavedNotification(petData.name);
        
        // If we're on the account page, trigger a refresh
        if (window.location.pathname.includes('account.html') && typeof window.loadAccountData === 'function') {
          console.log('🔄 Refreshing account page...');
          setTimeout(() => {
            window.loadAccountData();
          }, 1000);
        } else {
          console.log('💡 Tip: Visit your account page to see your pet!');
        }
      } else {
        console.warn('⚠️ Pet save response missing ID:', savedPet);
      }
    } catch (error) {
      console.error('❌ Error saving pet to database:', error);
      console.error('Error message:', error.message);
      console.error('Pet data that failed:', petData);
      
      // Try to extract more error details
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('validation') || errorMsg.includes('required')) {
          console.error('💡 Validation error - check that all required fields are filled');
        } else if (errorMsg.includes('unauthorized') || errorMsg.includes('token')) {
          console.error('💡 Authentication error - make sure you are logged in');
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          console.error('💡 Network error - check that backend server is running on http://localhost:8000');
        }
      }
    }
  }

  showPetSavedNotification(petName) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--accent, #C9A36A);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `;
    notification.textContent = `✅ ${petName} added to your account!`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  setupResultActions() {
    const buildBtn = document.getElementById('buildSubscriptionBtn');
    if (!buildBtn) return;
    buildBtn.addEventListener('click', () => {
      const url = this.buildSubscriptionUrl();
      window.location.href = url;
    });
  }

  buildSubscriptionUrl() {
    const params = new URLSearchParams();
    const petType = this.formData.petType || 'dog';
    params.set('type', petType);

    const weightValue = parseFloat(this.formData.weightValue);
    if (!isNaN(weightValue) && weightValue > 0) {
      const weightKg = this.formData.weightUnit === 'lb'
        ? weightValue / 2.20462
        : weightValue;
      params.set('weight', weightKg.toFixed(1));
    }

    params.set('age', this.mapAgeForSubscriptions());
    params.set('activity', this.mapActivityForSubscriptions());
    params.set('goal', 'maintain');

    return `subscriptions.html?${params.toString()}`;
  }

  mapAgeForSubscriptions() {
    if (this.formData.ageGroup === 'puppy_kitten') {
      return 'puppy';
    }
    return this.formData.ageGroup || 'adult';
  }

  mapActivityForSubscriptions() {
    switch (this.formData.activity) {
      case 'mellow':
        return 'low';
      case 'active':
        return 'normal';
      case 'very_active':
      case 'athlete':
        return 'high';
      default:
        return 'normal';
    }
  }

  closeModal() {
    const modal = document.getElementById('questionnaireModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      
      // Reset wizard after animation
      setTimeout(() => {
        this.resetWizard();
      }, 300);
    }
  }

  resetWizard() {
    this.currentSlide = 1;
    this.formData = {
      petType: '',
      name: '',
      activity: '',
      ageGroup: '',
      weightValue: '',
      weightUnit: 'kg',
      idealWeightValue: '',
      neutered: '',
      allergies: [],
      phone: ''
    };
    
    this.showSlide(1);
    
    // Reset form elements
    document.querySelectorAll('.btn-choice, .segment-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    });
    
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
      input.value = '';
    });

    // Show wizard UI
    const wizardActions = document.querySelector('.wizard-actions');
    const wizardProgress = document.querySelector('.wizard-progress');
    if (wizardActions) wizardActions.style.display = 'flex';
    if (wizardProgress) wizardProgress.style.display = 'block';
  }
}

// Initialize wizard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if modal exists
  if (document.getElementById('questionnaireModal')) {
    new QuestionnaireWizard();
  }
});

