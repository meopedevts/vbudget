---
applyTo: "**/*.tsx"
description: "Instruções de como utilizar o TanStack Form com os componentes SolidJS/Kobalte do projeto."
---

# TanStack Form com Componentes UI (SolidJS + Kobalte)

## Dependências

Antes de utilizar, instale as dependências necessárias:

```bash
pnpm add @tanstack/solid-form valibot @tanstack/valibot-form-adapter
```

---

## Padrões Gerais

Antes de ver cada campo individualmente, entenda os padrões que se repetem em **todos** os tipos de campo:

1. **`<TextField>` como wrapper universal:** O componente `<TextField>` é reutilizado como container de label, descrição e mensagens de erro para **todos** os tipos de campo — não apenas inputs de texto. Ele agrupa `<TextFieldLabel>`, `<TextFieldDescription>` e `<TextFieldErrorMessage>`.

2. **`validationState`:** A expressão abaixo deve ser usada em todo campo para controlar o estado visual de validação:

```tsx
validationState={
  field().state.meta.isTouched && !field().state.meta.isValid
    ? "invalid"
    : "valid"
}
```

3. **Exibição de erros:** Sempre use `<TextFieldErrorMessage errors={field().state.meta.errors} />` para exibir os erros de validação.

4. **Binding de campo:** Todo campo segue o padrão de conectar `name`, `value` (ou `checked` para booleanos), `onChange` e `onBlur` ao `field()`.

---

## 1. Criar o Schema

Defina a forma dos dados do formulário usando um schema do **Valibot**. Isso garante validação tipada e reutilizável.

```tsx
import * as v from "valibot"

const formSchema = v.object({
  title: v.pipe(
    v.string(),
    v.minLength(5, "O título deve ter pelo menos 5 caracteres."),
    v.maxLength(32, "O título deve ter no máximo 32 caracteres."),
  ),
  description: v.pipe(
    v.string(),
    v.minLength(20, "A descrição deve ter pelo menos 20 caracteres."),
    v.maxLength(100, "A descrição deve ter no máximo 100 caracteres."),
  ),
})

type formSchemaType = v.InferInput<typeof formSchema>
```

> Use `v.InferInput<typeof formSchema>` para inferir o tipo TypeScript a partir do schema. Isso mantém o tipo sincronizado automaticamente com as validações.

---

## 2. Configurar o Formulário

Use o hook `createForm` do `@tanstack/solid-form` para criar a instância do formulário com validação Valibot.

```tsx
import { createForm } from "@tanstack/solid-form"
import { toast } from "somoto"
import * as v from "valibot"

const formSchema = v.object({
  // ...
})

type formSchemaType = v.InferInput<typeof formSchema>

export function MeuFormulario() {
  const form = createForm(() => ({
    defaultValues: {
      title: "",
      description: "",
    } as formSchemaType,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.success("Formulário enviado com sucesso!")
    },
  }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      {/* campos aqui */}
    </form>
  )
}
```

> Estamos usando `onSubmit` em `validators` para validar os dados no momento do envio. O TanStack Form suporta outros modos de validação como `onChange`, `onBlur`, etc.

---

## 3. Campo Input

Para campos de input, use `field().state.value` e `field().handleChange` no componente `<TextField>`.
Para exibir erros, passe `field().state.meta.errors` para o `<TextFieldErrorMessage>`.

```tsx
import { createForm } from "@tanstack/solid-form"
import { toast } from "somoto"
import * as v from "valibot"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  TextField,
  TextFieldDescription,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field"

const formSchema = v.object({
  username: v.pipe(
    v.string(),
    v.minLength(3, "O nome de usuário deve ter pelo menos 3 caracteres."),
    v.maxLength(10, "O nome de usuário deve ter no máximo 10 caracteres."),
    v.regex(
      /^[a-zA-Z0-9_]+$/,
      "O nome de usuário só pode conter letras, números e underscores.",
    ),
  ),
})

type formSchemaType = v.InferInput<typeof formSchema>

const FormInputDemo = () => {
  const form = createForm(() => ({
    defaultValues: {
      username: "",
    } as formSchemaType,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: (props) => {
      toast("Valores enviados:", {
        description: (
          <pre class="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(props.value, null, 2)}</code>
          </pre>
        ),
      })
    },
  }))

  return (
    <Card class="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Configurações de Perfil</CardTitle>
        <CardDescription>
          Atualize suas informações de perfil abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-input"
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          class="flex w-full flex-col gap-7"
        >
          <form.Field name="username">
            {(field) => (
              <TextField
                validationState={
                  field().state.meta.isTouched && !field().state.meta.isValid
                    ? "invalid"
                    : "valid"
                }
                name={field().name}
                value={field().state.value}
                onBlur={field().handleBlur}
                onChange={field().handleChange}
              >
                <TextFieldLabel>Nome de usuário</TextFieldLabel>
                <TextFieldInput placeholder="meu_usuario" autocomplete="username" />
                <TextFieldDescription>
                  Este é seu nome de exibição público. Deve ter entre 3 e 10
                  caracteres e conter apenas letras, números e underscores.
                </TextFieldDescription>
                <TextFieldErrorMessage errors={field().state.meta.errors} />
              </TextField>
            )}
          </form.Field>
        </form>
      </CardContent>
      <CardFooter>
        <div class="flex gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Resetar
          </Button>
          <Button type="submit" form="form-input">
            Salvar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
```

### Pontos-chave do Input

- `value={field().state.value}` — vincula o valor do campo.
- `onChange={field().handleChange}` — atualiza o valor ao digitar.
- `onBlur={field().handleBlur}` — marca o campo como "tocado" ao perder foco.
- `name={field().name}` — conecta o nome do campo ao formulário.
- `<TextFieldInput>` — é o componente de input visual que herda as props do `<TextField>` pai.

---

## 4. Campo TextArea

Para campos de textarea, a estrutura é **idêntica** ao Input. A única diferença é trocar `<TextFieldInput>` por `<TextFieldTextArea>`.

```tsx
import { createForm } from "@tanstack/solid-form"
import { toast } from "somoto"
import * as v from "valibot"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  TextField,
  TextFieldDescription,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldTextArea,
} from "@/components/ui/text-field"

const formSchema = v.object({
  about: v.pipe(
    v.string(),
    v.minLength(10, "Por favor, forneça pelo menos 10 caracteres."),
    v.maxLength(200, "Por favor, mantenha abaixo de 200 caracteres."),
  ),
})

type formSchemaType = v.InferInput<typeof formSchema>

const FormTextAreaDemo = () => {
  const form = createForm(() => ({
    defaultValues: {
      about: "",
    } as formSchemaType,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: (props) => {
      toast("Valores enviados:", {
        description: (
          <pre class="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code>{JSON.stringify(props.value, null, 2)}</code>
          </pre>
        ),
      })
    },
  }))

  return (
    <Card class="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Personalização</CardTitle>
        <CardDescription>
          Personalize sua experiência nos contando mais sobre você.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-textarea"
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          class="flex w-full flex-col gap-7"
        >
          <form.Field name="about">
            {(field) => (
              <TextField
                validationState={
                  field().state.meta.isTouched && !field().state.meta.isValid
                    ? "invalid"
                    : "valid"
                }
                name={field().name}
                value={field().state.value}
                onBlur={field().handleBlur}
                onChange={field().handleChange}
              >
                <TextFieldLabel>Sobre você</TextFieldLabel>
                <TextFieldTextArea
                  placeholder="Sou um engenheiro de software..."
                  class="min-h-[120px]"
                />
                <TextFieldDescription>
                  Conte-nos mais sobre você. Isso será usado para
                  personalizar sua experiência.
                </TextFieldDescription>
                <TextFieldErrorMessage errors={field().state.meta.errors} />
              </TextField>
            )}
          </form.Field>
        </form>
      </CardContent>
      <CardFooter>
        <div class="flex gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Resetar
          </Button>
          <Button type="submit" form="form-textarea">
            Salvar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
```

### Pontos-chave do TextArea

- A única diferença em relação ao Input é o uso de `<TextFieldTextArea>` no lugar de `<TextFieldInput>`.
- Use `class="min-h-[120px]"` (ou outro valor) para definir a altura mínima do textarea.
- Todo o binding (`value`, `onChange`, `onBlur`, `name`, `validationState`) permanece no `<TextField>` pai.

---

## 5. Checkbox

Para o componente Checkbox, use `field().state.value` e `field().handleChange` no `<Checkbox>`.
Para exibir erros, passe `field().state.meta.errors` ao `<TextFieldErrorMessage>`.

Existem **dois padrões** de uso:

### 5.1 Checkbox Booleano (valor único)

Para um campo booleano simples (ligado/desligado):

```tsx
<form.Field name="responses">
  {(field) => (
    <TextField
      validationState={
        field().state.meta.isTouched && !field().state.meta.isValid
          ? "invalid"
          : "valid"
      }
    >
      <TextFieldLabel>Respostas</TextFieldLabel>
      <TextFieldDescription>
        Receba notificações para requisições que levam tempo.
      </TextFieldDescription>
      <TextFieldErrorMessage errors={field().state.meta.errors} />
      <Checkbox
        class="flex items-start gap-3"
        name={field().name}
        checked={field().state.value}
        onChange={field().handleChange}
      >
        <CheckboxInput />
        <CheckboxControl />
        <div class="grid gap-2">
          <CheckboxLabel>Notificações push</CheckboxLabel>
        </div>
      </Checkbox>
    </TextField>
  )}
</form.Field>
```

### 5.2 Array de Checkboxes (múltipla seleção)

Para um campo que aceita múltiplos valores (array de strings), use `field().pushValue()` para adicionar e `field().removeValue()` para remover:

```tsx
import { For } from "solid-js"
import { createForm } from "@tanstack/solid-form"
import * as v from "valibot"

import {
  Checkbox,
  CheckboxControl,
  CheckboxInput,
  CheckboxLabel,
} from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  TextField,
  TextFieldDescription,
  TextFieldErrorMessage,
  TextFieldLabel,
} from "@/components/ui/text-field"

const tasks = [
  { id: "push", label: "Notificações push" },
  { id: "email", label: "Notificações por email" },
] as const

const formSchema = v.object({
  tasks: v.pipe(
    v.array(v.string()),
    v.minLength(1, "Selecione pelo menos um tipo de notificação."),
    v.check(
      (value) => value.every((task) => tasks.some((t) => t.id === task)),
      "Tipo de notificação inválido selecionado.",
    ),
  ),
})
```

```tsx
<form.Field name="tasks">
  {(field) => (
    <TextField
      validationState={
        field().state.meta.isTouched && !field().state.meta.isValid
          ? "invalid"
          : "valid"
      }
    >
      <TextFieldLabel>Tarefas</TextFieldLabel>
      <TextFieldDescription>
        Receba notificações quando tarefas que você criou tiverem atualizações.
      </TextFieldDescription>
      <div class="flex flex-col gap-3">
        <For each={tasks}>
          {(task) => (
            <Checkbox
              validationState={
                field().state.meta.isTouched && !field().state.meta.isValid
                  ? "invalid"
                  : "valid"
              }
              name={field().name}
              checked={field().state.value.includes(task.id)}
              onChange={(checked) => {
                if (checked) {
                  field().pushValue(task.id)
                } else {
                  const index = field().state.value.indexOf(task.id)
                  if (index > -1) {
                    field().removeValue(index)
                  }
                }
              }}
              class="flex items-start gap-3"
            >
              <CheckboxInput />
              <CheckboxControl />
              <div class="grid gap-2">
                <CheckboxLabel>{task.label}</CheckboxLabel>
              </div>
            </Checkbox>
          )}
        </For>
      </div>
      <TextFieldErrorMessage errors={field().state.meta.errors} />
    </TextField>
  )}
</form.Field>
```

### Pontos-chave do Checkbox

- **Booleano:** Use `checked={field().state.value}` e `onChange={field().handleChange}` diretamente.
- **Array:** Use `checked={field().state.value.includes(item.id)}` e no `onChange`, use `field().pushValue()` para adicionar e `field().removeValue(index)` para remover.
- **`validationState`** deve ser aplicado em cada `<Checkbox>` individual no caso de array.
- Use `<Separator />` entre seções de checkboxes quando fizer sentido visualmente.

---

## 6. Select

Para o componente Select, use `field().state.value` no `value` do `<Select>` e chame `field().handleChange()` + `field().handleBlur()` dentro do `onChange`.
Para exibir erros, passe `field().state.meta.errors` ao `<TextFieldErrorMessage>`.

```tsx
import { createForm } from "@tanstack/solid-form"
import * as v from "valibot"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
} from "@/components/ui/text-field"

const PLANS = ["starter", "pro", "enterprise"] as const
type Plan = typeof PLANS[number]

const planLabel = (p: string) => {
  switch (p) {
    case "starter":    return "Starter"
    case "pro":        return "Pro"
    case "enterprise": return "Enterprise"
    default:           return p
  }
}

const formSchema = v.object({
  plan: v.pipe(
    v.string(),
    v.minLength(1, "Selecione um plano."),
  ),
})

type formSchemaType = v.InferInput<typeof formSchema>
```

```tsx
<form.Field name="plan">
  {(field) => (
    <TextField
      validationState={
        field().state.meta.isTouched && !field().state.meta.isValid
          ? "invalid"
          : "valid"
      }
    >
      <TextFieldLabel>Plano</TextFieldLabel>
      <Select<string>
        value={field().state.value}
        onChange={(v) => {
          if (v != null) {
            field().handleChange(v)
            field().handleBlur()
          }
        }}
        options={[...PLANS]}
        itemComponent={(p) => (
          <SelectItem item={p.item}>{planLabel(p.item.rawValue)}</SelectItem>
        )}
      >
        <SelectTrigger class="w-full">
          <SelectValue<string>>
            {(state) => planLabel(state.selectedOption())}
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
      <TextFieldErrorMessage errors={field().state.meta.errors} />
    </TextField>
  )}
</form.Field>
```

### Pontos-chave do Select

- `<Select>` **não** é filho do `<TextField>` — ele fica como irmão de `<TextFieldLabel>` e `<TextFieldErrorMessage>` dentro do wrapper `<TextField>`.
- Como o `<Select>` não expõe um evento `onBlur`, chame `field().handleBlur()` manualmente dentro do `onChange`, logo após `field().handleChange(v)`. Isso garante que a validação visual seja disparada quando o usuário selecionar uma opção.
- Valide `v != null` antes de chamar `handleChange` para evitar limpar o campo acidentalmente quando o select for desmontado.
- `value={field().state.value}` mantém o Select sincronizado com o estado do form.
- Valide com `v.string()` + `v.minLength(1, ...)` para forçar que uma opção seja selecionada.

---

## 7. Array de Objetos Complexos

Para campos que gerenciam uma **lista dinâmica de objetos** (ex: destinatários com `name` e `contact`), use sinais locais para os inputs temporários do "novo item" e `field().pushValue(obj)` / `field().removeValue(index)` para gerenciar o array.

```tsx
import { batch, createSignal, For, Show } from "solid-js"
import { createForm } from "@tanstack/solid-form"
import { UserPlus, X } from "lucide-solid"
import * as v from "valibot"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field"

const formSchema = v.object({
  recipients: v.pipe(
    v.array(
      v.object({
        name:    v.pipe(v.string(), v.minLength(1, "Nome é obrigatório.")),
        contact: v.pipe(v.string(), v.minLength(1, "Contato é obrigatório.")),
      }),
    ),
    v.minLength(1, "Adicione pelo menos um destinatário."),
  ),
})

type formSchemaType = v.InferInput<typeof formSchema>
```

```tsx
// Sinais locais para os inputs temporários — fora do schema do form
const [newName, setNewName]       = createSignal("")
const [newContact, setNewContact] = createSignal("")

<form.Field name="recipients">
  {(field) => (
    <TextField
      validationState={
        field().state.meta.isTouched && !field().state.meta.isValid
          ? "invalid"
          : "valid"
      }
    >
      <TextFieldLabel>Destinatários</TextFieldLabel>

      {/* Lista atual de itens */}
      <Show when={field().state.value.length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={field().state.value}>
            {(r, i) => (
              <Badge variant="secondary" class="gap-1 pr-1">
                {r.name} ({r.contact})
                <button
                  type="button"
                  class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  onClick={() => field().removeValue(i())}
                >
                  <X class="size-3" />
                </button>
              </Badge>
            )}
          </For>
        </div>
      </Show>

      {/* Inputs para adicionar novo item */}
      <div class="flex items-end gap-2">
        <TextField class="flex-1" value={newName()} onChange={setNewName}>
          <TextFieldLabel class="text-xs">Nome</TextFieldLabel>
          <TextFieldInput placeholder="Nome" />
        </TextField>
        <TextField class="flex-1" value={newContact()} onChange={setNewContact}>
          <TextFieldLabel class="text-xs">Contato</TextFieldLabel>
          <TextFieldInput placeholder="Email ou telefone" />
        </TextField>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            const name    = newName().trim()
            const contact = newContact().trim()
            if (!name || !contact) return
            field().pushValue({ name, contact })
            batch(() => {
              setNewName("")
              setNewContact("")
            })
          }}
        >
          <UserPlus class="size-4" />
        </Button>
      </div>

      <TextFieldErrorMessage errors={field().state.meta.errors} />
    </TextField>
  )}
</form.Field>
```

### Pontos-chave do Array de Objetos

- Use **sinais locais** (`createSignal`) para os inputs temporários do "novo item" — eles **não fazem parte** do schema do form, são apenas estado de UI para capturar o próximo item a ser adicionado.
- `field().pushValue(obj)` adiciona um novo objeto ao array do form.
- `field().removeValue(i())` remove pelo índice — use o accessor `i()` do `<For>` (não o valor `i` diretamente), pois ele é reativo.
- Use `batch()` do `solid-js` para limpar múltiplos sinais de uma vez após adicionar o item, evitando renders intermediários.
- O schema usa `v.array(v.object({ ... }))` com `v.minLength(1, ...)` para validar o array completo.
- Para passar `pushValue` como argumento de uma função externa, type como `(v: { name: string; contact: string }) => void`.

---

## 8. Radio Group

Para o componente Radio Group, use `field().state.value` e `field().handleChange` no `<RadioGroup>`.
Para exibir erros, passe `field().state.meta.errors` ao `<TextFieldErrorMessage>`.

```tsx
import { For } from "solid-js"
import { createForm } from "@tanstack/solid-form"
import { useRadioGroupContext } from "@kobalte/core/radio-group"
import * as v from "valibot"

import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemIndicator,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupItems,
} from "@/components/ui/radio-group"
import {
  TextField,
  TextFieldDescription,
  TextFieldErrorMessage,
  TextFieldLabel,
} from "@/components/ui/text-field"

const plans = [
  {
    id: "starter",
    title: "Starter (100K tokens/mês)",
    description: "Para uso diário com funcionalidades básicas.",
  },
  {
    id: "pro",
    title: "Pro (1M tokens/mês)",
    description: "Para uso avançado de IA com mais funcionalidades.",
  },
  {
    id: "enterprise",
    title: "Enterprise (Tokens ilimitados)",
    description: "Para grandes equipes e uso intensivo.",
  },
]

const formSchema = v.object({
  plan: v.pipe(
    v.string(),
    v.minLength(1, "Você deve selecionar um plano para continuar."),
  ),
})
```

```tsx
<form.Field name="plan">
  {(field) => (
    <TextField
      validationState={
        field().state.meta.isTouched && !field().state.meta.isValid
          ? "invalid"
          : "valid"
      }
    >
      <TextFieldLabel>Plano</TextFieldLabel>
      <TextFieldDescription>
        Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
      </TextFieldDescription>
      <RadioGroup
        validationState={
          field().state.meta.isTouched && !field().state.meta.isValid
            ? "invalid"
            : "valid"
        }
        name={field().name}
        value={field().state.value}
        onChange={field().handleChange}
      >
        <RadioGroupItems class="flex-col">
          <For each={plans}>
            {(plan) => {
              const context = useRadioGroupContext()

              return (
                <RadioGroupItem
                  value={plan.id}
                  class="data-checked:border-primary data-checked:bg-primary/5 flex justify-between rounded-md border p-4 transition-colors"
                  onClick={() => {
                    context.setSelectedValue(plan.id)
                  }}
                >
                  <RadioGroupItemInput />
                  <div class="flex flex-col gap-3">
                    <RadioGroupItemLabel>{plan.title}</RadioGroupItemLabel>
                    <RadioGroupDescription>
                      {plan.description}
                    </RadioGroupDescription>
                  </div>
                  <RadioGroupItemControl class="self-start">
                    <RadioGroupItemIndicator />
                  </RadioGroupItemControl>
                </RadioGroupItem>
              )
            }}
          </For>
        </RadioGroupItems>
      </RadioGroup>
      <TextFieldErrorMessage errors={field().state.meta.errors} />
    </TextField>
  )}
</form.Field>
```

### Pontos-chave do Radio Group

- `<RadioGroup>` recebe `validationState`, `name`, `value` e `onChange` — mesma lógica de binding dos outros campos.
- Use `useRadioGroupContext()` de `@kobalte/core/radio-group` junto com `context.setSelectedValue(plan.id)` no `onClick` do `<RadioGroupItem>` para garantir que clicar em qualquer área do item faça a seleção (não apenas no indicador).
- `<RadioGroupItems class="flex-col">` organiza os itens em layout vertical.
- Estilize os itens como cards com `data-checked:border-primary data-checked:bg-primary/5 ... border p-4 rounded-md` para feedback visual de seleção.
- Validação: use `v.string()` com `v.minLength(1, ...)` para forçar que o usuário selecione uma opção.

---

## 9. Switch

Para o componente Switch, use `field().state.value` e `field().handleChange` no `<Switch>`.
Para exibir erros, passe `field().state.meta.errors` ao `<TextFieldErrorMessage>`.

> **Atenção:** O Switch tem um **layout diferente** dos outros campos. O `<TextField>` (com label/descrição/erros) e o `<Switch>` ficam **lado a lado** (flex row), não aninhados.

```tsx
import { createForm } from "@tanstack/solid-form"
import * as v from "valibot"

import {
  TextField,
  TextFieldDescription,
  TextFieldErrorMessage,
  TextFieldLabel,
} from "@/components/ui/text-field"
import { Switch, SwitchControl, SwitchInput, SwitchThumb } from "@/components/ui/switch"

const formSchema = v.object({
  twoFactor: v.pipe(
    v.boolean(),
    v.check(
      (val) => val,
      "É altamente recomendado ativar a autenticação de dois fatores.",
    ),
  ),
})
```

```tsx
<form.Field name="twoFactor">
  {(field) => (
    <div class="flex gap-3">
      <TextField
        validationState={
          field().state.meta.isTouched && !field().state.meta.isValid
            ? "invalid"
            : "valid"
        }
      >
        <TextFieldLabel>Autenticação multifator</TextFieldLabel>
        <TextFieldDescription>
          Ative a autenticação multifator para proteger sua conta.
        </TextFieldDescription>
        <TextFieldErrorMessage errors={field().state.meta.errors} />
      </TextField>
      <Switch
        class="flex items-center gap-x-2 self-start"
        name={field().name}
        checked={field().state.value}
        onChange={field().handleChange}
      >
        <SwitchInput />
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>
    </div>
  )}
</form.Field>
```

### Pontos-chave do Switch

- **Layout side-by-side:** `<TextField>` e `<Switch>` ficam dentro de um `<div class="flex gap-3">`, lado a lado. O `<Switch>` usa `self-start` para alinhar ao topo.
- O binding é o mesmo de um checkbox booleano: `checked={field().state.value}` e `onChange={field().handleChange}`.
- `validationState` é aplicado apenas no `<TextField>`, não no `<Switch>`.
- Validação com `v.boolean()` + `v.check((val) => val, "mensagem")` para forçar que esteja ativado.

---

## 10. Resetar o Formulário

Use `form.reset()` para restaurar todos os campos aos seus valores padrão (`defaultValues`).

```tsx
<Button type="button" variant="outline" onClick={() => form.reset()}>
  Resetar
</Button>
```

> **Importante:** Use `type="button"` no botão de reset para evitar que ele dispare o submit do formulário acidentalmente.

`form.reset()` também aceita valores como primeiro argumento para resetar o formulário para um estado específico — útil no modo de edição:

```tsx
// Reset para os defaultValues originais
form.reset()

// Reset para valores específicos (ex: ao abrir um dialog de edição)
form.reset(getDefaultValues())
```

---

## 11. Formulário em Dialog

Quando o formulário fica dentro de um `<Dialog>`, o botão de submit normalmente está no `<DialogFooter>`, **fora** do elemento `<form>`. Use o atributo `id` no `<form>` e `form="..."` no `<Button type="submit">` para conectá-los via HTML nativo.

Além disso, use `createEffect` para observar o sinal `open()` e chamar `form.reset()` toda vez que o dialog abrir — isso garante que o form seja limpo no modo de criação ou preenchido com os dados corretos no modo de edição.

```tsx
import { createEffect, createSignal } from "solid-js"
import { createForm } from "@tanstack/solid-form"

const [open, setOpen] = createSignal(false)

const getDefaultValues = () => ({
  // Para edição: valores do item; para criação: valores vazios
  title: props.item?.title ?? "",
})

const form = createForm(() => ({
  defaultValues: getDefaultValues(),
  // ...
}))

// Reset sempre que o dialog abre — garante estado correto em create e edit
createEffect(() => {
  if (open()) {
    form.reset(getDefaultValues())
  }
})
```

```tsx
<Dialog open={open()} onOpenChange={setOpen}>
  <DialogTrigger as={...} />
  <DialogPortal>
    <DialogContent>
      <DialogHeader>...</DialogHeader>

      {/* <form> fica no corpo do DialogContent */}
      <form
        id="form-meu-dialog"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        {/* campos aqui */}
      </form>

      {/* Botões ficam no DialogFooter, fora do <form> */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        {/* form="form-meu-dialog" conecta este botão ao <form> pelo id */}
        <Button type="submit" form="form-meu-dialog">
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </DialogPortal>
</Dialog>
```

### Pontos-chave do Formulário em Dialog

- O atributo `form="id-do-form"` no `<Button type="submit">` conecta o botão ao `<form>` correto pelo `id`, mesmo estando fora dele no DOM — comportamento nativo do HTML.
- Use `createEffect` para observar `open()` e chamar `form.reset(getDefaultValues())` ao abrir — não apenas `form.reset()`, para que o modo de edição pré-preencha os campos corretamente.
- Chame `form.handleSubmit()` com `void` para suprimir avisos de Promise não tratada: `void form.handleSubmit()`.
- Feche o dialog (`setOpen(false)`) dentro do `onSubmit` do form, após chamar `props.onSave(...)`.

