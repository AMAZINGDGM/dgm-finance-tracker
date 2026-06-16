import { NextResponse, type NextRequest } from "next/server";

import { requireFinanceUser } from "@/lib/api/auth";
import { formatZodError, productSchema } from "@/lib/finance/validation";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  getWorkspaceScopedQuery,
  pickActiveWorkspace
} from "@/lib/workspaces";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFinanceUser();

    if ("response" in auth) {
      return auth.response;
    }

    const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
    const activeWorkspace = pickActiveWorkspace(
      workspaces,
      request.cookies.get(activeWorkspaceCookieName)?.value
    );

    if (activeWorkspace?.type !== "business") {
      return NextResponse.json({ products: [] });
    }

    const query = auth.supabase
      .from("products")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    const { data, error } = await getWorkspaceScopedQuery(query, activeWorkspace.id);

    if (error) {
      console.error("[products:GET]", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    console.error("[products:GET]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load products. Check the products table and RLS policies."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFinanceUser();

    if ("response" in auth) {
      return auth.response;
    }

    const payload = await request.json().catch(() => null);
    const parsed = productSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
    const activeWorkspace = pickActiveWorkspace(
      workspaces,
      request.cookies.get(activeWorkspaceCookieName)?.value
    );

    if (!activeWorkspace) {
      return NextResponse.json({ error: "No active workspace found." }, { status: 400 });
    }

    if (activeWorkspace.type !== "business") {
      return NextResponse.json(
        { error: "Inventory is available for business workspaces only." },
        { status: 403 }
      );
    }

    const { data, error } = await auth.supabase
      .from("products")
      .insert({
        ...parsed.data,
        brand: parsed.data.brand || null,
        category: parsed.data.category || null,
        condition: parsed.data.condition || null,
        notes: parsed.data.notes || null,
        sku: parsed.data.sku || null,
        user_id: auth.user.id,
        workspace_id: activeWorkspace.id
      })
      .select("*")
      .single();

    if (error) {
      console.error("[products:POST]", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error("[products:POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save product. Check the products table and RLS policies."
      },
      { status: 500 }
    );
  }
}
