import { store } from "@/store";
import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import React from "react";
import { Provider } from "react-redux";
import { ConfigProvider } from "./ConfigProvider";
import { JwtProvider } from "./JwtProvider";
const ClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const httpLink = createHttpLink({
    uri: `${import.meta.env.VITE_BACKEND_URI}/graphql`,
    credentials: "same-origin"
  });
  const authLink = setContext(async (_, { headers }) => {
    const token = localStorage.getItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX as string);
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
        "Apollo-Require-Preflight": "true"
      }
    };
  });
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });
  return (
    <ApolloProvider client={client}>
      <Provider store={store}>
        <ConfigProvider>
          <JwtProvider>{children}</JwtProvider>
        </ConfigProvider>
      </Provider>
    </ApolloProvider>
  );
};

export { ClientProvider };
