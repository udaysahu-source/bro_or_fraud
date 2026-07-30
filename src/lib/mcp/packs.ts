// Shared pack data used by MCP tools. Includes a small curated word
// set per pack for `roll_match` — the app's UI carries only pack metadata.

export type PackMeta = {
  id: string;
  name: string;
  tag: string;
  wordCount: number;
  description: string;
};

export type PackData = PackMeta & { words: string[] };

export const PACKS: PackData[] = [
  {
    id: "college-life",
    name: "College Life",
    tag: "COLLEGE",
    wordCount: 20,
    description: "Assignment, exams, canteen chill, and backlog anxiety.",
    words: [
      "Assignment", "Attendance", "Proxy", "Backbench", "Frontbench",
      "Semester", "Backlog", "CGPA", "Viva", "Lab",
      "Professor", "HOD", "Project", "Exam", "Notes",
      "Canteen", "Hostel", "Library", "Placement", "Internship"
    ]
  },
  {
    id: "relationships",
    name: "Relationships",
    tag: "RELATION",
    wordCount: 20,
    description: "Crushes, breakups, flirting, and red flags.",
    words: [
      "Crush", "Ex", "Proposal", "Date", "Ghosting",
      "Friendzone", "Breakup", "Heartbreak", "Love", "Marriage",
      "Jealous", "Cheating", "Soulmate", "Wedding", "Flirting",
      "Kiss", "Hug", "Single", "Situationship", "Red Flag"
    ]
  },
  {
    id: "gen-z",
    name: "Gen Z",
    tag: "GENZ",
    wordCount: 20,
    description: "Rizz, aura, cooked, cap, and brainrot terms.",
    words: [
      "Rizz", "Sigma", "Aura", "Delulu", "NPC",
      "GOAT", "Cooked", "Cringe", "POV", "Flex",
      "Simp", "Meme", "Viral", "Ratio", "Reels",
      "Trending", "Brainrot", "Locked In", "Touch Grass", "Glow Up"
    ]
  },
  {
    id: "indian-parents",
    name: "Indian Parents",
    tag: "PARENTS",
    wordCount: 20,
    description: "Chappals, curfew lectures, and Sharma Ji ka beta comparison.",
    words: [
      "Chappal", "Belt", "Remote", "Electricity Bill", "Sharma Ji",
      "Doctor", "Engineer", "Tuition", "Homework", "Savings",
      "LIC", "FD", "Relatives", "Marriage", "Marks",
      "Curfew", "Lecture", "Newspaper", "TV", "Scooter"
    ]
  },
  {
    id: "food",
    name: "Food",
    tag: "FOOD",
    wordCount: 20,
    description: "Midnight Maggi runs, pani puri, and biryani cravings.",
    words: [
      "Pizza", "Burger", "Biryani", "Momos", "Maggi",
      "Paneer", "Dosa", "Idli", "Samosa", "Chai",
      "Coffee", "Ice Cream", "Chocolate", "Pasta", "Sandwich",
      "Paratha", "Jalebi", "Pani Puri", "Cake", "Noodles"
    ]
  },
  {
    id: "cricket",
    name: "Cricket",
    tag: "CRICKET",
    wordCount: 20,
    description: "Dhoni finishes, yorkers, and IPL group debates.",
    words: [
      "Kohli", "Dhoni", "Rohit", "Sachin", "Bat",
      "Ball", "Wicket", "Six", "Four", "Catch",
      "Bowler", "Batsman", "Spinner", "Yorker", "IPL",
      "World Cup", "Umpire", "Helmet", "Stumps", "Boundary"
    ]
  },
  {
    id: "gaming",
    name: "Gaming",
    tag: "GAME",
    wordCount: 20,
    description: "Valorant ranks, BGMI loot, and pro vs noob squabbles.",
    words: [
      "BGMI", "Free Fire", "Minecraft", "Valorant", "Roblox",
      "PlayStation", "Xbox", "Noob", "Pro", "Sniper",
      "Loot", "Skin", "Rank", "Victory", "Headshot",
      "Camping", "Respawn", "Controller", "Keyboard", "Mouse"
    ]
  },
  {
    id: "anime",
    name: "Anime",
    tag: "ANIME",
    wordCount: 20,
    description: "Ninja paths, devil fruits, shoujo and shonen tropes.",
    words: [
      "Naruto", "Luffy", "Zoro", "Gojo", "Sukuna",
      "Titan", "Sharingan", "Rasengan", "Bankai", "Hokage",
      "Pirate", "Marine", "Hero", "Villain", "Sensei",
      "Ninja", "Samurai", "Devil Fruit", "Curse", "Anime"
    ]
  },
  {
    id: "movies",
    name: "Movies",
    tag: "MOVIE",
    wordCount: 20,
    description: "Climax scenes, popcorn buckets, and K-Jo blockbusters.",
    words: [
      "Hero", "Villain", "Director", "Actor", "Cinema",
      "Popcorn", "Interval", "Trailer", "Comedy", "Horror",
      "Thriller", "Romance", "Action", "Oscar", "Netflix",
      "OTT", "Bollywood", "Hollywood", "Climax", "Sequel"
    ]
  },
  {
    id: "bikes",
    name: "Bikes",
    tag: "BIKES",
    wordCount: 20,
    description: "Royal Enfield classic thumps and KTM revs.",
    words: [
      "Royal Enfield", "KTM", "Yamaha", "Honda", "Helmet",
      "Clutch", "Brake", "Gear", "Engine", "Exhaust",
      "Petrol", "Mileage", "ABS", "Ride", "Wheelie",
      "Chain", "Tyre", "Mirror", "Speed", "Highway"
    ]
  },
  {
    id: "travel",
    name: "Travel",
    tag: "TRAVEL",
    wordCount: 20,
    description: "Goa trips, Manali escapes, and backpack maps.",
    words: [
      "Goa", "Manali", "Kashmir", "Beach", "Mountain",
      "Train", "Flight", "Passport", "Visa", "Hotel",
      "Resort", "Camping", "Backpack", "Suitcase", "Taxi",
      "Metro", "Map", "Road Trip", "Sunrise", "Sunset"
    ]
  },
  {
    id: "body-parts",
    name: "Body Parts",
    tag: "BODY",
    wordCount: 20,
    description: "Instantly recognizable anatomy names.",
    words: [
      "Head", "Hair", "Forehead", "Eye", "Eyebrow",
      "Ear", "Nose", "Mouth", "Tongue", "Teeth",
      "Neck", "Shoulder", "Chest", "Heart", "Stomach",
      "Hand", "Finger", "Knee", "Foot", "Toe"
    ]
  },
  {
    id: "animals",
    name: "Animals",
    tag: "ANIMAL",
    wordCount: 20,
    description: "Wild cats, domestic pets, and common farm creatures.",
    words: [
      "Lion", "Tiger", "Elephant", "Monkey", "Dog",
      "Cat", "Horse", "Cow", "Buffalo", "Snake",
      "Rabbit", "Bear", "Fox", "Wolf", "Camel",
      "Goat", "Hen", "Eagle", "Parrot", "Fish"
    ]
  },
  {
    id: "vehicles",
    name: "Vehicles",
    tag: "VEHICLES",
    wordCount: 20,
    description: "Trains, cycles, tractors, and emergency engines.",
    words: [
      "Car", "Bike", "Bus", "Truck", "Train",
      "Metro", "Plane", "Helicopter", "Boat", "Ship",
      "Scooter", "Auto", "Cycle", "Tractor", "Ambulance",
      "Police Car", "Fire Truck", "Taxi", "Rickshaw", "Bulldozer"
    ]
  },
  {
    id: "tech",
    name: "Tech",
    tag: "TECH",
    wordCount: 20,
    description: "Smartphones, chargers, wifi routers, and AI services.",
    words: [
      "Phone", "Laptop", "Computer", "Keyboard", "Mouse",
      "Monitor", "WiFi", "Bluetooth", "Camera", "Charger",
      "Power Bank", "Headphones", "Smartwatch", "Instagram", "YouTube",
      "Google", "ChatGPT", "Netflix", "USB", "Printer"
    ]
  },
  {
    id: "jobs",
    name: "Jobs",
    tag: "JOBS",
    wordCount: 20,
    description: "Doctors, pilots, chefs, and daily professions.",
    words: [
      "Doctor", "Engineer", "Teacher", "Police", "Lawyer",
      "Pilot", "Chef", "Farmer", "Driver", "Singer",
      "Actor", "Plumber", "Electrician", "Soldier", "Judge",
      "Scientist", "Photographer", "Journalist", "Barber", "Mechanic"
    ]
  },
  {
    id: "brands",
    name: "Brands",
    tag: "BRANDS",
    wordCount: 20,
    description: "Global fashion, fast food chains, and local operators.",
    words: [
      "Apple", "Samsung", "Nike", "Adidas", "Puma",
      "Amazon", "Flipkart", "Zomato", "Swiggy", "Jio",
      "Airtel", "Coca-Cola", "Pepsi", "McDonald's", "KFC",
      "Domino's", "BMW", "Mercedes", "Toyota", "Tata"
    ]
  },
  {
    id: "daily-life",
    name: "Daily Life",
    tag: "DAILY",
    wordCount: 20,
    description: "Alarms, toothbrush scrubs, AC remotes, and door keys.",
    words: [
      "Alarm", "Wallet", "Money", "UPI", "ATM",
      "Fan", "AC", "Mirror", "Toothbrush", "Soap",
      "Shampoo", "Towel", "Bed", "Pillow", "Chair",
      "Bottle", "Clock", "Door", "Window", "Key"
    ]
  }
];

export const PACK_META: PackMeta[] = PACKS.map(({ words: _w, ...meta }) => meta);

export function findPack(id: string): PackData | undefined {
  return PACKS.find((p) => p.id === id);
}
