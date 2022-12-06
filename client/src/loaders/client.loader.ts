import { makeRequest } from "helpers";
import { redirect } from "react-router-dom";
import { SafeClient } from "schemas";

export async function clientLoader() {
  try {
    const { client } = await makeRequest<{
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

export async function requireClientLoader() {
  try {
    const loaded = await clientLoader();

    if (!loaded?.client) {
      throw redirect("/signin");
    }

    return { client: loaded.client };
  } catch (error) {
    throw redirect("/signin");
  }
}

export async function requireAdminLoader() {
  try {
    const { client } = await requireClientLoader();

    if (!client.permissionLevel.includes("admin")) {
      throw redirect("/me");
    }

    return { client };
  } catch (error) {
    throw redirect("/me");
  }
}
