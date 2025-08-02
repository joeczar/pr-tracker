<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const isOpen = ref(false)
const command = ref('')

const handleExecute = () => {
  console.log('Executing command:', command.value)
  // Simulate command execution
  command.value = ''
  isOpen.value = false
}

const handleCancel = () => {
  command.value = ''
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="terminal" size="sm">
        >> EXECUTE_COMMAND
      </Button>
    </DialogTrigger>
    <DialogContent variant="terminal" class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle variant="terminal">
          TERMINAL_INTERFACE v2.0
        </DialogTitle>
        <DialogDescription variant="terminal">
          > system_prompt: Enter command to execute in the cyberpunk terminal
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label 
            for="command" 
            class="text-right font-terminal text-primary"
          >
            CMD:
          </Label>
          <Input
            id="command"
            v-model="command"
            placeholder="pr-tracker --scan --repos"
            variant="terminal"
            class="col-span-3"
          />
        </div>
        <div class="col-span-4 text-xs font-terminal text-muted-foreground bg-muted/20 p-3 rounded border border-muted">
          > Available commands: scan, analyze, export, status<br>
          > Use --help for command documentation
        </div>
      </div>
      <DialogFooter class="gap-2">
        <Button 
          variant="outline" 
          @click="handleCancel"
          class="font-terminal"
        >
          >> CANCEL
        </Button>
        <Button 
          variant="terminal" 
          @click="handleExecute"
          :disabled="!command.trim()"
        >
          >> EXECUTE
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>