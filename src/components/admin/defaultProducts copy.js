// Map by image file name (without path) so it's easy to maintain.
// You can add as many as you want. Images must live under /src/assets/default-products/
export const DEFAULT_PRODUCTS = [
    {
        file: "img1.jpg",
        title: "Cold-Pressed Gingelly Oil",
        subtitle: "Wood-pressed, chemical-free",
        sizeLabel: "1L",
        mrp: 560,
        price: 520,
        cashbackAmount: 0,
        stock: 20,
        order: 10,
        active: true,
    },
    {
        file: "img2.jpg",
        title: "Cold-Pressed Groundnut Oil",
        subtitle: "Stone ghani, natural aroma",
        sizeLabel: "1L",
        mrp: 480,
        price: 440,
        cashbackAmount: 0,
        stock: 20,
        order: 20,
        active: true,
    },
    {
        file: "img3.jpg",
        title: "Multi-Millet Flour",
        subtitle: "High-fiber, slow carbs",
        sizeLabel: "KG",
        mrp: 140,
        price: 120,
        cashbackAmount: 0,
        stock: 30,
        order: 30,
        active: true,
    },
    // …add more rows, just make sure the `file` exists in /src/assets/default-products/
];
