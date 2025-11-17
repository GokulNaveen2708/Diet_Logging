import boto3
from decimal import Decimal

# If you use a named profile like "diet-app", uncomment this:
session = boto3.Session(profile_name="diet-app")
dynamodb = session.resource("dynamodb")


FOODS_TABLE_NAME = "Foods"

foods = [
    {
        "foodId": "chicken_breast",
        "name": "Chicken Breast, Cooked",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 165,
        "proteinPerUnit": 31,
        "carbsPerUnit": 0,
        "fatPerUnit": 3.6,
    },
    {
        "foodId": "egg_whole",
        "name": "Egg, Whole, Cooked",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 155,
        "proteinPerUnit": 13,
        "carbsPerUnit": 1.1,
        "fatPerUnit": 11,
    },
    {
        "foodId": "whole_milk",
        "name": "Whole Milk",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 61,
        "proteinPerUnit": 3.2,
        "carbsPerUnit": 4.8,
        "fatPerUnit": 3.3,
    },
    {
        "foodId": "greek_yogurt_plain",
        "name": "Greek Yogurt, Plain",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 59,
        "proteinPerUnit": 10,
        "carbsPerUnit": 3.6,
        "fatPerUnit": 0.4,
    },
    {
        "foodId": "white_rice_cooked",
        "name": "White Rice, Cooked",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 130,
        "proteinPerUnit": 2.7,
        "carbsPerUnit": 28,
        "fatPerUnit": 0.3,
    },
    {
        "foodId": "brown_rice_cooked",
        "name": "Brown Rice, Cooked",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 123,
        "proteinPerUnit": 2.6,
        "carbsPerUnit": 25.6,
        "fatPerUnit": 1,
    },
    {
        "foodId": "oatmeal_dry",
        "name": "Oats, Dry",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 389,
        "proteinPerUnit": 16.9,
        "carbsPerUnit": 66.3,
        "fatPerUnit": 6.9,
    },
    {
        "foodId": "banana",
        "name": "Banana, Raw",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 89,
        "proteinPerUnit": 1.1,
        "carbsPerUnit": 23,
        "fatPerUnit": 0.3,
    },
    {
        "foodId": "apple",
        "name": "Apple, Raw, With Skin",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 52,
        "proteinPerUnit": 0.3,
        "carbsPerUnit": 14,
        "fatPerUnit": 0.2,
    },
    {
        "foodId": "orange",
        "name": "Orange, Raw",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 47,
        "proteinPerUnit": 0.9,
        "carbsPerUnit": 12,
        "fatPerUnit": 0.1,
    },
    {
        "foodId": "peanut_butter",
        "name": "Peanut Butter",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 588,
        "proteinPerUnit": 25,
        "carbsPerUnit": 20,
        "fatPerUnit": 50,
    },
    {
        "foodId": "almond_butter",
        "name": "Almond Butter",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 614,
        "proteinPerUnit": 21,
        "carbsPerUnit": 19,
        "fatPerUnit": 56,
    },
    {
        "foodId": "olive_oil",
        "name": "Olive Oil",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 884,
        "proteinPerUnit": 0,
        "carbsPerUnit": 0,
        "fatPerUnit": 100,
    },
    {
        "foodId": "butter",
        "name": "Butter",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 717,
        "proteinPerUnit": 0.9,
        "carbsPerUnit": 0.1,
        "fatPerUnit": 81,
    },
    {
        "foodId": "broccoli_raw",
        "name": "Broccoli, Raw",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 34,
        "proteinPerUnit": 2.8,
        "carbsPerUnit": 7,
        "fatPerUnit": 0.4,
    },
    {
        "foodId": "sweet_potato_baked",
        "name": "Sweet Potato, Baked, Without Skin",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 90,
        "proteinPerUnit": 2,
        "carbsPerUnit": 21,
        "fatPerUnit": 0.2,
    },
    {
        "foodId": "potato_baked",
        "name": "Potato, Baked, Flesh and Skin",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 93,
        "proteinPerUnit": 2.5,
        "carbsPerUnit": 21,
        "fatPerUnit": 0.1,
    },
    {
        "foodId": "whey_protein",
        "name": "Whey Protein Powder",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 400,
        "proteinPerUnit": 80,
        "carbsPerUnit": 10,
        "fatPerUnit": 7,
    },
    {
        "foodId": "white_bread",
        "name": "White Bread",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 265,
        "proteinPerUnit": 9,
        "carbsPerUnit": 49,
        "fatPerUnit": 3.2,
    },
    {
        "foodId": "cheddar_cheese",
        "name": "Cheddar Cheese",
        "defaultUnit": "g",
        "gramsPerUnit": 100,
        "caloriesPerUnit": 403,
        "proteinPerUnit": 25,
        "carbsPerUnit": 1.3,
        "fatPerUnit": 33,
    },
]


NUM_FIELDS = ["gramsPerUnit", "caloriesPerUnit", "proteinPerUnit", "carbsPerUnit", "fatPerUnit"]

def seed_foods():
    table = dynamodb.Table(FOODS_TABLE_NAME)
    for food in foods:
        print(f"Putting item: {food['foodId']} - {food['name']}")
        item = food.copy()
        for k in NUM_FIELDS:
            item[k] = Decimal(str(item[k]))
        table.put_item(Item=item)
    print("Done seeding Foods table.")

if __name__ == "__main__":
    seed_foods()
