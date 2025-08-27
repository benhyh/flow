import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    const services: Record<string, string> = {}

    // Check if environment variables are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      services.supabase = 'not_configured'
    } else {
      try {
        // Check Supabase connection
        const { error: supabaseError } = await supabase
          .from('users')
          .select('count')
          .limit(1)

        services.supabase = supabaseError ? 'error' : 'connected'
      } catch {
        services.supabase = 'error'
      }
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      services.redis = 'not_configured'
    } else {
      try {
        // Check Redis connection
        await redis.ping()
        services.redis = 'connected'
      } catch {
        services.redis = 'error'
      }
    }

    const isHealthy = Object.values(services).every(status => 
      status === 'connected' || status === 'not_configured'
    )

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
