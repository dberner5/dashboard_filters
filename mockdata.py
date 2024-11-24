import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random


columns = ['transaction_id', 'date', 'customer_id', 'age_group', 'gender', 'region', 'income_bracket', 
           'category_l1', 'category_l2', 'category_l3', 'retailer', 'brand', 'product_name', 'quantity', 'price']

# Create initial DataFrame
df = pd.DataFrame(columns=columns)

# Define possible values for each column
demographics = {
    'age_group': ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    'gender': ['Male', 'Female', 'Non-binary'],
    'region': ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'],
    'income_bracket': ['$25k-$49k', '$50k-$74k', '$75k-$99k', '$100k-$149k', '$150k+']
}

product_names = {
    'Apparel & Accessories': {
        'Tops': ['Running Tank', 'V-Neck Tee', 'Performance Polo', 'Workout Shirt'],
        'Bottoms': ['Slim Fit Jeans', 'Athletic Shorts', 'Yoga Pants', 'Chino Pants'],
        'Dresses': ['Summer Maxi', 'Cocktail Dress', 'Wrap Dress', 'Evening Gown'],
        'Outerwear': ['Winter Parka', 'Rain Jacket', 'Fleece Pullover', 'Windbreaker'],
        'Athletic': ['Running Shoes', 'Training Shoes', 'Basketball Shoes', 'Tennis Shoes'],
        'Casual': ['Slip-on Sneakers', 'Canvas Shoes', 'Loafers', 'Sandals'],
        'Formal': ['Oxford Shoes', 'Dress Boots', 'Heels', 'Loafers'],
        'Bags': ['Backpack', 'Tote Bag', 'Crossbody Bag', 'Duffel Bag'],
        'Jewelry': ['Silver Necklace', 'Gold Bracelet', 'Diamond Earrings', 'Watch'],
        'Watches': ['Smartwatch', 'Chronograph Watch', 'Dress Watch', 'Sports Watch']
    },
    'Electronics': {
        'Laptops': ['MacBook Air', 'ThinkPad X1', 'XPS 13', 'Chromebook'],
        'Desktops': ['iMac', 'Gaming PC', 'All-in-One', 'Workstation'],
        'Tablets': ['iPad Pro', 'Galaxy Tab', 'Surface Pro', 'Fire HD'],
        'Smartphones': ['iPhone 15', 'Galaxy S24', 'Pixel 8', 'OnePlus 12'],
        'Smartwatches': ['Apple Watch', 'Galaxy Watch', 'Fitbit Sense', 'Garmin'],
        'Headphones': ['AirPods Pro', 'QC45', 'WH-1000XM5', 'Buds Pro'],
        'Speakers': ['HomePod', 'Sonos One', 'Echo Studio', 'SoundLink']
    },
    'Home & Garden': {
        'Living Room': ['Sofa Set', 'Coffee Table', 'TV Stand', 'Recliner'],
        'Bedroom': ['Bed Frame', 'Mattress', 'Dresser', 'Nightstand'],
        'Dining Room': ['Dining Table', 'Chair Set', 'Buffet', 'Bar Stools'],
        'Kitchen': ['Gas Range', 'Refrigerator', 'Dishwasher', 'Microwave'],
        'Laundry': ['Washer', 'Dryer', 'Washer/Dryer Combo', 'Steam Iron'],
        'Wall Art': ['Canvas Print', 'Metal Wall Art', 'Photo Frames', 'Mirrors'],
        'Lighting': ['Pendant Light', 'Floor Lamp', 'Table Lamp', 'Chandelier'],
        'Rugs': ['Area Rug', 'Runner', 'Outdoor Rug', 'Bath Mat']
    }
}

categories = {
    'Apparel & Accessories': {
        'Clothing': ['Tops', 'Bottoms', 'Dresses', 'Outerwear'],
        'Shoes': ['Athletic', 'Casual', 'Formal'],
        'Accessories': ['Bags', 'Jewelry', 'Watches']
    },
    'Electronics': {
        'Computers': ['Laptops', 'Desktops', 'Tablets'],
        'Mobile Devices': ['Smartphones', 'Smartwatches'],
        'Audio': ['Headphones', 'Speakers']
    },
    'Home & Garden': {
        'Furniture': ['Living Room', 'Bedroom', 'Dining Room'],
        'Appliances': ['Kitchen', 'Laundry'],
        'Decor': ['Wall Art', 'Lighting', 'Rugs']
    }
}

retailers = ['Target', 'Walmart', 'Best Buy', 'The Home Depot', 'Lowes', 'Dicks']
brands = {
    'Apparel & Accessories': ['Nike', 'Adidas', 'North Face', 'Coach', 'Cole Haan'],
    'Electronics': ['Apple', 'Samsung', 'Sony', 'Dell', 'Bose'],
    'Home & Garden': ['Weber', 'Traeger', 'Ashley', 'Nexgrill', 'Scotts']
}

# Generate 500 transactions
transactions = []
start_date = datetime(2024, 1, 1)

for i in range(1, 10000):  # Starting from 1016 to continue from existing data
    date = start_date + timedelta(days=random.randint(0, 364))
    
    cat_l1 = random.choice(list(categories.keys()))
    cat_l2 = random.choice(list(categories[cat_l1].keys()))
    cat_l3 = random.choice(categories[cat_l1][cat_l2])
    
    brand = random.choice(brands[cat_l1])
    
    # Get appropriate product names for the category
    if cat_l3 in product_names[cat_l1]:
        product_base = random.choice(product_names[cat_l1][cat_l3])
    else:
        product_base = f"{cat_l3} Product"  # Fallback
    
    if cat_l1 == 'Electronics':
        price = round(random.uniform(199.99, 1499.99), 2)
    elif cat_l1 == 'Home & Garden':
        price = round(random.uniform(49.99, 999.99), 2)
    else:  # Apparel
        price = round(random.uniform(19.99, 299.99), 2)

    transaction = {
        'transaction_id': i,
        'date': date.strftime('%Y-%m-%d'),
        'customer_id': f'C{random.randint(1000, 9999)}',
        'age_group': random.choice(demographics['age_group']),
        'gender': random.choice(demographics['gender']),
        'region': random.choice(demographics['region']),
        'income_bracket': random.choice(demographics['income_bracket']),
        'category_l1': cat_l1,
        'category_l2': cat_l2,
        'category_l3': cat_l3,
        'retailer': random.choice(retailers),
        'brand': brand,
        'product_name': f'{brand} {product_base}',
        'quantity': random.randint(1, 3),
        'price': price
    }
    transactions.append(transaction)

# Create DataFrame with new transactions
new_df = pd.DataFrame(transactions)

# Combine initial and new data
combined_df = pd.concat([df, new_df], ignore_index=True)

# Save to CSV
combined_df.to_csv('app/data.csv', index=False)

print(f"Generated {len(new_df)} new transactions")
print(f"Total transactions: {len(combined_df)}")

# Show samples
print("\nFirst 5 rows:")
print(combined_df.head().to_string())
print("\nRandom 5 rows from the middle:")
print(combined_df.sample(5).to_string())
print("\nLast 5 rows:")
print(combined_df.tail().to_string())