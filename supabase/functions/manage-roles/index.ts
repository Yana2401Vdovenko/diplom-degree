import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageRolesRequest {
  action: 'ping' | 'listUsers' | 'assignRole';
  email?: string;
  role?: string;
}

function getAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function assertAdmin(callerJwt: string) {
  const adminClient = getAdminClient();
  const token = callerJwt.replace('Bearer ', '');
  const { data, error } = await adminClient.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  const role = String(data.user.app_metadata?.role ?? data.user.user_metadata?.role ?? '');

  if (role !== 'admin') {
    throw new Error('Forbidden');
  }

  return data.user;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    await assertAdmin(authHeader);

    const body = (await request.json()) as ManageRolesRequest;
    const adminClient = getAdminClient();

    if (body.action === 'ping') {
      return new Response(
        JSON.stringify({
          ok: true,
          checkedAt: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (body.action === 'listUsers') {
      const { data, error } = await adminClient.auth.admin.listUsers();

      if (error) {
        throw error;
      }

      const users = (data.users ?? []).map((user) => ({
        id: user.id,
        email: user.email ?? '',
        role: String(user.app_metadata?.role ?? user.user_metadata?.role ?? ''),
      }));

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'assignRole') {
      if (!body.email || !body.role) {
        throw new Error('Email and role are required.');
      }

      const { data, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        throw listError;
      }

      const targetUser = (data.users ?? []).find(
        (user) => user.email?.toLowerCase() === body.email?.toLowerCase(),
      );

      if (!targetUser) {
        throw new Error('User not found.');
      }

      const { error } = await adminClient.auth.admin.updateUserById(targetUser.id, {
        app_metadata: {
          ...targetUser.app_metadata,
          role: body.role,
        },
      });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unsupported action.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
