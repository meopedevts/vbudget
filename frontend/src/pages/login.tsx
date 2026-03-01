import {createSignal, Show} from 'solid-js'
import {useNavigate} from '@solidjs/router'
import {authService} from '@/lib/api/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from '@/components/ui/text-field'
import {Button} from '@/components/ui/button'

export default function LoginPage() {
  const navigate = useNavigate()

  const [mode, setMode] = createSignal<'login' | 'register'>('login')
  const [name, setName] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode() === 'login') {
        await authService.login({name: name(), password: password()})
      } else {
        await authService.register({name: name(), password: password()})
      }
      navigate('/', {replace: true})
    } catch (err: any) {
      if (err?.status === 401) {
        setError('Usuário ou senha inválidos.')
      } else if (err?.status === 400) {
        setError(err?.message ?? 'Dados inválidos.')
      } else {
        setError('Erro inesperado. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="flex min-h-screen items-center justify-center bg-background p-4">
      <div class="w-full max-w-sm space-y-4">
        {/* Logo / brand */}
        <div class="flex items-center justify-center gap-2">
          <div class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span class="text-lg font-bold">V</span>
          </div>
          <span class="text-2xl font-semibold">VBudget</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode() === 'login' ? 'Entrar' : 'Criar conta'}
            </CardTitle>
            <CardDescription>
              {mode() === 'login'
                ? 'Acesse sua conta para continuar.'
                : 'Preencha os dados para criar sua conta.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} class="space-y-4">
              {/* Error banner */}
              <Show when={error()}>
                <p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error()}
                </p>
              </Show>

              {/* Name field */}
              <TextField>
                <TextFieldLabel>Usuário</TextFieldLabel>
                <TextFieldInput
                  type="text"
                  placeholder="Seu nome de usuário"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  required
                  autofocus
                />
              </TextField>

              {/* Password field */}
              <TextField>
                <TextFieldLabel>Senha</TextFieldLabel>
                <TextFieldInput
                  type="password"
                  placeholder="••••••••"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                />
              </TextField>

              <Button type="submit" class="w-full" disabled={loading()}>
                {loading()
                  ? 'Aguarde…'
                  : mode() === 'login'
                    ? 'Entrar'
                    : 'Criar conta'}
              </Button>
            </form>

            {/* Toggle mode */}
            <p class="mt-4 text-center text-sm text-muted-foreground">
              {mode() === 'login' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
              <button
                type="button"
                class="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setMode(mode() === 'login' ? 'register' : 'login')
                  setError('')
                }}
              >
                {mode() === 'login' ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

