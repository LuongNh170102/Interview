import { gql } from "@apollo/client";
const GET_FOOD = gql`
  query GetFood($menu_slug: String!, $tag_slug: String!) {
    foodList(menu_slug: $menu_slug, tag_slug: $tag_slug) {
      _id
      food_name_en
      food_name_vi
      featured_image
      category_food_id
      price
      size
    }
  }
`;
export { GET_FOOD };
