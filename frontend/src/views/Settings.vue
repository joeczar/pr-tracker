<script setup lang="ts">
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardFooter from '@/components/ui/card/CardFooter.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import Button from '@/components/ui/button/Button.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import Switch from '@/components/ui/switch/Switch.vue'
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const themeDark = ref(true)
const compactMode = ref(false)
const emailNotif = ref(true)
const pushNotif = ref(false)
</script>

<template>
  <section aria-labelledby="settings-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="settings-title" class="text-xl font-semibold tracking-tight">Settings</h1>
      <div class="text-xs text-slate-500">Using shadcn-vue primitives</div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile -->
      <Card aria-label="Profile">
        <CardHeader>
          <CardTitle class="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="name" placeholder="Your name" />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" placeholder="you@example.com" type="email" />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="ml-auto">Save Profile</Button>
        </CardFooter>
      </Card>

      <!-- Preferences -->
      <Card aria-label="Preferences">
        <CardHeader>
          <CardTitle class="text-sm">Preferences</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="grid">
              <span class="text-sm font-medium">Dark theme</span>
              <span class="text-xs text-slate-500">Use cyber dark theme</span>
            </div>
            <Switch v-model:checked="themeDark" aria-label="Toggle dark theme" />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="grid">
              <span class="text-sm font-medium">Compact mode</span>
              <span class="text-xs text-slate-500">Tighten spacing for dense data</span>
            </div>
            <Switch v-model:checked="compactMode" aria-label="Toggle compact mode" />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="ml-auto">Save Preferences</Button>
        </CardFooter>
      </Card>

      <!-- Notifications -->
      <Card aria-label="Notifications">
        <CardHeader>
          <CardTitle class="text-sm">Notifications</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="grid">
              <span class="text-sm font-medium">Email notifications</span>
              <span class="text-xs text-slate-500">Receive updates via email</span>
            </div>
            <Switch v-model:checked="emailNotif" aria-label="Toggle email notifications" />
          </div>
          <div class="flex items-center justify-between">
            <div class="grid">
              <span class="text-sm font-medium">Push notifications</span>
              <span class="text-xs text-slate-500">Receive push alerts</span>
            </div>
            <Switch v-model:checked="pushNotif" aria-label="Toggle push notifications" />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="ml-auto">Save Notifications</Button>
        </CardFooter>
      </Card>

      <!-- Integrations -->
      <Card class="lg:col-span-2" aria-label="Integrations">
        <CardHeader>
          <CardTitle class="text-sm">Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          </div>
        </CardContent>
      </Card>

      <!-- Danger Zone -->
      <Card aria-label="Danger Zone" class="border-rose-200 dark:border-rose-800">
        <CardHeader>
          <CardTitle class="text-sm">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="h-10 w-full rounded border border-dashed border-rose-300 dark:border-rose-700"></div>
          <div class="h-10 w-48 rounded border border-dashed border-rose-300 dark:border-rose-700"></div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" class="ml-auto">Delete Account</Button>
        </CardFooter>
      </Card>
    </div>
  </section>
</template>
