<template lang="pug">

  .snemovny-seznam.section-padding.alt-bg

    h2.section-title {{Nadpis}}

    .container-list.columns.is-multiline

      ParlamentNahled(
        v-for="parlament in Parlamenty"
        :key="parlament.Id"
        :Nazev="parlament.Nazev"
        :Id="parlament.Id"
        class="is-one-third-desktop is-half-tablet column")


    .component-footer(v-if="MaButtonMore")

      .buttons-more

        NuxtLink(class="typo-form-button button-large" :to="`${ButtonMoreLink}`") Zobrazit všechny parlamenty

</template>

<style lang="sass" scoped>

  .section-title
    @extend %typography-section-title

</style>

<script>

const ParlamentNahled = () => import('~/components/ParlamentNahled.vue');


export default {

   components: { ParlamentNahled },


   props: ['Parlamenty', 'MaButtonMore', 'ButtonMoreLink', 'Nadpis'],
}
</script>
