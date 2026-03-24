import { useMemo, useState } from 'react'
import { Title } from 'react-admin'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/Colors'

type MigrationResponse = {
  success?: boolean
  error?: string
  done?: boolean
  mode?: string
  selectedPendingProperties?: number
  stats?: {
    propertiesScanned: number
    propertiesUpdated: number
    propertiesPendingInBatch: number
    imagesTotal: number
    imagesMigrated: number
    imagesAlreadyOnR2: number
    imagesSkippedExternal: number
    imagesFailed: number
    dryRun: boolean
    limit: number
    offset: number
  }
  errors?: string[]
  status?: {
    totalPropertiesWithImages: number
    fullyMigratedProperties: number
    pendingPropertiesCount: number
    pendingPropertyIds: string[]
    scannedProperties: number
    scannedAll: boolean
    maxScanProperties: number
  }
}

const parsePositiveNumber = (value: string, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }
  return Math.floor(parsed)
}

const StorageMigrationPage = () => {
  const [limit, setLimit] = useState('10')
  const [offset, setOffset] = useState('0')
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)
  const [autoMessage, setAutoMessage] = useState<string | null>(null)
  const [response, setResponse] = useState<MigrationResponse | null>(null)
  const [statusResponse, setStatusResponse] = useState<MigrationResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const parsedLimit = useMemo(() => parsePositiveNumber(limit, 50), [limit])
  const parsedOffset = useMemo(() => parsePositiveNumber(offset, 0), [offset])

  const runMigrationBatch = async () => {
    setLoading(true)
    setErrorMessage(null)
    setResponse(null)

    try {
      const { data, error } = await supabase.functions.invoke('r2-media', {
        body: {
          action: 'migrate_existing',
          limit: parsedLimit,
          offset: parsedOffset,
          dryRun,
        },
      })

      if (error) {
        throw new Error(error.message || 'Migration request failed')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setResponse(data as MigrationResponse)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to run migration batch')
    } finally {
      setLoading(false)
    }
  }

  const loadMigrationStatus = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.functions.invoke('r2-media', {
        body: { action: 'migration_status' },
      })

      if (error) {
        throw new Error(error.message || 'Failed to load migration status')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setStatusResponse(data as MigrationResponse)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load migration status')
    } finally {
      setLoading(false)
    }
  }

  const runBackgroundTick = async () => {
    setLoading(true)
    setErrorMessage(null)
    setResponse(null)

    try {
      const { data, error } = await supabase.functions.invoke('r2-media', {
        body: {
          action: 'background_migrate_tick',
          batchLimit: parsedLimit,
          scanLimit: 600,
        },
      })

      if (error) {
        throw new Error(error.message || 'Background tick failed')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setResponse(data as MigrationResponse)
      await loadMigrationStatus()
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to run background tick')
    } finally {
      setLoading(false)
    }
  }

  const startAutoMigration = async () => {
    setLoading(true)
    setAutoRunning(true)
    setErrorMessage(null)
    setAutoMessage('Starting migration...')

    try {
      const maxCycles = 200
      let cycle = 0
      let finished = false

      while (!finished && cycle < maxCycles) {
        cycle += 1
        setAutoMessage(`Running server tick ${cycle}...`)

        const { data, error } = await supabase.functions.invoke('r2-media', {
          body: {
            action: 'background_migrate_tick',
            batchLimit: parsedLimit,
            scanLimit: 600,
          },
        })

        if (error) {
          throw new Error(error.message || 'Background tick failed')
        }
        if (data?.error) {
          throw new Error(data.error)
        }

        const tick = data as MigrationResponse
        setResponse(tick)
        finished = Boolean(tick.done)

        // Small delay between ticks to avoid hammering the edge function
        if (!finished) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      await loadMigrationStatus()
      setAutoMessage(finished ? 'Migration finished.' : 'Stopped after max cycles. Click again to continue.')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Auto migration failed')
    } finally {
      setAutoRunning(false)
      setLoading(false)
    }
  }

  return (
    <Box>
      <Title title="Storage Migration" />
      <Card sx={{ maxWidth: 920, border: `1px solid ${Colors.neutral[200]}` }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Cloudflare R2 Migration
          </Typography>
          <Typography variant="body2" sx={{ color: Colors.neutral[600], mb: 3 }}>
            Migrate existing property image URLs from Supabase Storage to Cloudflare R2 in controlled batches.
            Run dry mode first, then run again with dry mode disabled to apply updates.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Batch limit"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              inputProps={{ min: 1, max: 200 }}
              type="number"
              fullWidth
            />
            <TextField
              label="Offset"
              value={offset}
              onChange={(event) => setOffset(event.target.value)}
              inputProps={{ min: 0 }}
              type="number"
              fullWidth
            />
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
              />
            }
            label="Dry run (analyze only, do not update database)"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="contained" onClick={runMigrationBatch} disabled={loading}>
              {loading ? 'Running...' : 'Run Batch'}
            </Button>
            <Button variant="contained" color="secondary" onClick={runBackgroundTick} disabled={loading}>
              {loading ? 'Running...' : 'Run Server Tick'}
            </Button>
            <Button variant="contained" color="success" onClick={startAutoMigration} disabled={loading || autoRunning}>
              {autoRunning ? 'Auto Running...' : 'Start Migration'}
            </Button>
            <Button variant="outlined" onClick={loadMigrationStatus} disabled={loading}>
              Check Status
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            For unattended migration, schedule `r2-media` with action `background_migrate_tick` in Supabase cron.
            This continues even when the site is closed.
          </Alert>

          {autoMessage && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {autoMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {response?.stats && (
            <Alert severity={response.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Batch completed ({response.stats.dryRun ? 'dry run' : 'applied'})
              </Typography>
              <Typography variant="body2">Properties scanned: {response.stats.propertiesScanned}</Typography>
              <Typography variant="body2">Properties updated: {response.stats.propertiesUpdated}</Typography>
              <Typography variant="body2">Properties pending in this batch: {response.stats.propertiesPendingInBatch}</Typography>
              <Typography variant="body2">Images total: {response.stats.imagesTotal}</Typography>
              <Typography variant="body2">Images migrated: {response.stats.imagesMigrated}</Typography>
              <Typography variant="body2">Already on R2: {response.stats.imagesAlreadyOnR2}</Typography>
              <Typography variant="body2">External skipped: {response.stats.imagesSkippedExternal}</Typography>
              <Typography variant="body2">Failed: {response.stats.imagesFailed}</Typography>
            </Alert>
          )}

          {statusResponse?.status && (
            <Alert severity={statusResponse.status.pendingPropertiesCount === 0 ? 'success' : 'info'} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Global migration status
              </Typography>
              <Typography variant="body2">Total properties with images: {statusResponse.status.totalPropertiesWithImages}</Typography>
              <Typography variant="body2">Fully migrated properties: {statusResponse.status.fullyMigratedProperties}</Typography>
              <Typography variant="body2">Pending properties: {statusResponse.status.pendingPropertiesCount}</Typography>
              <Typography variant="body2">Scanned properties: {statusResponse.status.scannedProperties}</Typography>
              {!statusResponse.status.scannedAll && (
                <Typography variant="body2">
                  Scan hit limit ({statusResponse.status.maxScanProperties}). Increase `R2_MIGRATION_STATUS_MAX_SCAN` for full accuracy.
                </Typography>
              )}
              {statusResponse.status.pendingPropertyIds.length > 0 && (
                <>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                    Pending property IDs (first {statusResponse.status.pendingPropertyIds.length})
                  </Typography>
                  {statusResponse.status.pendingPropertyIds.map((id) => (
                    <Typography key={id} variant="body2">
                      - {id}
                    </Typography>
                  ))}
                </>
              )}
            </Alert>
          )}

          {response?.errors && response.errors.length > 0 && (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Migration warnings
              </Typography>
              {response.errors.map((entry, index) => (
                <Typography key={`${entry}-${index}`} variant="body2">
                  - {entry}
                </Typography>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default StorageMigrationPage
