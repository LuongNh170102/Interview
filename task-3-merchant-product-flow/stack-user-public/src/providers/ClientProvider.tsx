"use client";
import { store } from "@/store";
import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { Provider } from "react-redux";
import { ConfigProvider } from "./ConfigProvider";
import { JwtProvider } from "./JwtProvider";
type Props = {
  locale: string;
  messages: Record<string, any>;
};
const ClientProvider: React.FC<React.PropsWithChildren<Props>> = ({ children, locale, messages }) => {
  const httpLink = createHttpLink({
    uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
    credentials: "same-origin"
  });
  const authLink = setContext(async (_, { headers }) => {
    const token = localStorage.getItem("access_token");
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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ApolloProvider client={client}>
        <Provider store={store}>
          <ConfigProvider>
            <JwtProvider>{children}</JwtProvider>
          </ConfigProvider>
        </Provider>
      </ApolloProvider>
    </NextIntlClientProvider>
  );
};

export { ClientProvider };
