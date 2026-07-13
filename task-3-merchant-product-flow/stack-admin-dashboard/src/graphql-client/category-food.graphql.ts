import { gql } from "@apollo/client";
const GET_MENU_FOOD = gql`
  query GetMenuFood {
    menuList {
      _id
      category_food_name_en
      category_food_name_vi
      category_food_slug
      category_food_image
      category_food_parent_id
    }
  }
`;
const GET_MENU_TAG = gql`
  query GetMenuTag($menu: String!) {
    tagList(menu: $menu) {
      _id
      category_food_name_en
      category_food_name_vi
      category_food_slug
      category_food_image
      category_food_parent_id
    }
  }
`;
export { GET_MENU_FOOD, GET_MENU_TAG };
