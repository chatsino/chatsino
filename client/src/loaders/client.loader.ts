import { makeHttpRequest } from "helpers";
import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { SafeClient } from "schemas";

export async function clientLoader() {
  try {
    const { client } = await makeHttpRequest<{
      client: SafeClient;
    }>("get", "/auth/validate");

    return { client };
  } catch (error) {
    return null;
  }
}

export async function meRedirectLoader() {
  try {
    const loaded = await clientLoader();

    if (loaded?.client) {
      throw redirect("/me");
    }

    return { validated: true };
  } catch (error) {
    throw redirect("/me");
  }
}

export async function requireClientLoader(loader: LoaderFunctionArgs) {
  const { pathname } = new URL(loader.request.url);
  const redirectRoute =
    pathname === "/signout" ? "/signin" : `/signin?redirect=${pathname}`;

  try {
    const loaded = await clientLoader();

    if (!loaded?.client) {
      throw redirect(redirectRoute);
    }

    return { client: loaded.client };
  } catch (error) {
    throw redirect(redirectRoute);
  }
}

export async function requireAdminLoader(loader: LoaderFunctionArgs) {
  try {
    const { client } = await requireClientLoader(loader);

    if (!client.permissionLevel.includes("admin")) {
      throw redirect("/me");
    }

    return { client };
  } catch (error) {
    throw redirect("/me");
  }
}
