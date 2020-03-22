<template>
  <div id="actionbuttons">
    <input type="button" name="start" value="開始" v-on:click="$emit('start')"/>
    <input type="button" name="stop" value="停止" v-on:click="$emit('stop')" />
    <input type="button" name="stop" value="開始(fast)" v-on:click="$emit('start-fast')" />
    <input type="button" name="stop" value="限界" v-on:click="$emit('to-fast')" />
    <input type="button" name="stop" value="射精" v-on:click="$emit('last')" />
    <input type="button" name="stop" value="終了" v-on:click="$emit('exit')" />
  </div>
</template>
