import { makeHttpRequest } from "helpers";
import { LoaderFunctionArgs, redirect } from "react-router-dom";

export async function clientLoader() {
  try {
    const { user } = (await makeHttpRequest("get", "/auth/validate")) as {
      user: ChatsinoUser;
    };

    return { client: user };
  } catch (error) {
    return null;
  }
}

export async function chatRedirectLoader() {
  try {
    const loaded = await clientLoader();

    if (loaded?.client) {
      throw redirect("/chat");
    }

    return { validated: true };
  } catch (error) {
    throw redirect("/chat");
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

    return loaded;
  } catch (error) {
    throw redirect(redirectRoute);
  }
}

export async function requireAdminLoader(loader: LoaderFunctionArgs) {
  try {
    const { client } = await requireClientLoader(loader);
    const adminRoles: ChatsinoUserRole[] = ["operator", "administrator"];

    if (!adminRoles.includes(client.role)) {
      throw redirect("/chat");
    }

    return { client };
  } catch (error) {
    throw redirect("/chat");
  }
}
