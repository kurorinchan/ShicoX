<template>
  <div id="actionbuttons">
    <input
      type="button"
      class="btn-flat-border"
      name="start"
      value="開始"
      v-on:click="$emit('start')"
    />
    <input class="btn-flat-border" type="button" name="stop" value="停止" v-on:click="$emit('stop')" />
    <input
      class="btn-flat-border"
      type="button"
      name="stop"
      value="開始(fast)"
      v-on:click="$emit('start-fast')"
    />
    <input
      class="btn-flat-border"
      type="button"
      name="stop"
      value="限界"
      v-on:click="$emit('giveup')"
    />
    <input class="btn-flat-border" type="button" name="stop" value="射精" v-on:click="$emit('last')" />
    <input class="btn-flat-border" type="button" name="stop" value="終了" v-on:click="$emit('exit')" />
  </div>
</template>

<style scoped>
.btn-flat-border {
  display: inline-block;
  padding: 0.3em 1em;
  text-decoration: none;
  color: #103f5c;
  border: solid 2px #67c5ff;
  border-radius: 3px;
  transition: 0.4s;
  background: #ffffff;
  font-size: 1em;
}

.btn-flat-border:hover {
  background: #67c5ff;
  color: white;
}

.btn-stitch {
  display: inline-block;
  padding: 0.5em 1em;
  text-decoration: none;
  background: #668ad8;
  color: #fff;
  border-radius: 4px;
  box-shadow: 0px 0px 0px 5px #668ad8;
  border: dashed 1px #fff;
}

.btn-stitch:hover {
  border: dotted 1px #fff;
}

.btn-square-pop {
  position: relative;
  display: inline-block;
  padding: 0.25em 0.5em;
  text-decoration: none;
  color: #fff;
  background: #fd9535; /*背景色*/
  border-bottom: solid 2px #d27d00; /*少し濃い目の色に*/
  border-radius: 4px; /*角の丸み*/
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.2),
    0 2px 2px rgba(0, 0, 0, 0.19);
  font-weight: bold;
}

.btn-square-pop:active {
  border-bottom: solid 2px #fd9535;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.btn-circle-flat {
  display: inline-block;
  text-decoration: none;
  background: #87befd;
  color: #fff;
  width: 120px;
  height: 120px;
  line-height: 120px;
  border-radius: 50%;
  text-align: center;
  overflow: hidden;
  transition: 0.4s;
}

.btn-circle-flat:hover {
  background: #668ad8;
}
.btn-circle-border-simple {
  display: inline-block;
  text-decoration: none;
  color: #668ad8;
  width: 100px;
  height: 100px;
  line-height: 100px;
  border-radius: 50%;
  border: solid 2px #668ad8;
  text-align: center;
  overflow: hidden;
  font-weight: bold;
  transition: 0.4s;
  background: #ffffff;
  font-size: 2em;
}

.btn-circle-border-simple:hover {
  background: #b3e1ff;
}
</style>