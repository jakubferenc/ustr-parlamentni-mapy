<template lang="pug">
header.main-header
  .top-bar
    <Logo />
    <MainMenu />
    SearchNav(
      @click.native.prevent="searchNavHandler"
    )
  .search-results(v-show="searchNavStatus")
    .search-results__header-container
      h2.is-title.typography-main-title Vyhledat poslance

      .search-results__search-bar
        label(for="search-input") Vyhledejte pomocí jména, příjmení, nebo celého jména poslance
        input(type="text" name="search-input" v-model="searchQuery" placeholder="Vyhledejte pomocí jména, příjmení, nebo celého jména poslance")
        .search-button

    .search-results__content-container

      .loading-message(v-if="isLoading") Načítám data...

      .loading-message(v-if="!isLoading && searchQuery && (poslanci ===  null || poslanci.length === 0)") Žádní poslanci nevyvhovují vyhledávání

      PoslanciSeznamAPI(
        v-if="!isLoading && poslanci"

        :PoslanciVstupniPolozky="poslanci"
        :MaPaginaci="false"
        :MaFiltr="false"
        :MaStatistiky="false"
        :MaButtonMore="false"
        :ButtonMoreLink="false"
        :MaMapu="false"
        :Nadpis="false"
        :Mod="['list']"
        :MaRazeni="true"
      )

</template>

<style lang="sass">

$margin-body: 50px

.main-header
  position: sticky
  top: 0
  z-index: 99

  .top-bar
    background: #fff
    height: 80px
    display: flex
    justify-content: space-between
    padding: 0 $margin-body
    align-items: center
    display: flex
    justify-content: space-between
    a
      color: #000
      font-size: 15px
      font-family: Courier, monospace

  .search-results
    position: fixed
    overflow: auto
    top: 80px
    background: #fff
    width: 100%
    height: calc(100vh - 80px)
    backdrop-filter: blur(2px)

    .is-title
      margin-top: 0
      padding-top: 0

    .loading-message
      padding: $margin-body

    &__header-container
      padding: $margin-body

    &__search-bar

      input
        width: 100%

  .main-menu
    min-width: 60%
    display: flex
    justify-content: space-between
    align-items: center

html.has-slider .main-header
  position: relative
  .top-bar
    background-color: transparent
    position: absolute
    width: 100%

    a, &
      color: #fff

    .logo svg *
      fill: #fff
</style>

<script>
import { stringifyQueryForAPI } from '~/utils/functions';
import { mapGetters } from 'vuex';

import Logo from '../components/Logo.vue';
import MainMenu from '../components/MainMenu.vue';
import SearchNav from '../components/SearchNav.vue';
import Slider from '../components/Slider.vue';
import SearchIconImage from '~/assets/images/icon-search.svg?inline';

const PoslanciSeznamAPI = () => import('~/components/PoslanciSeznamAPI.vue');

export default {
  components: { Logo, MainMenu, SearchNav, Slider, SearchIconImage, PoslanciSeznamAPI },

  data() {
    return {
      isLoading: false,
      searchQuery: '',
      currentQuery: {},
      timeoutCallback: () => {},
      defaultQuery: {
        Poslanec: ['true'],
        Limit: [99999],
        Stranka: [1],
      },
    };
  },
  async created() {},
  computed: {
    ...mapGetters({
      searchNavStatus: 'getSearchNavStatus',
      poslanciRaw: 'getPoslanciSearch',
    }),

    currentQueryStringified() {
      return `?${this.stringifyQueryForAPI(this.currentQuery)}`;
    },
    poslanci() {
      return this.poslanciRaw.length ? this.poslanciRaw : null;
    },
  },
  watch: {
    searchQuery(oldVal, newVal) {
      this.searchHandler();
    },
  },
  methods: {
    stringifyQueryForAPI,
    async searchHandler() {
      clearTimeout(this.timeoutCallback);

      if (!this.searchQuery || this.searchQuery === '') {
        // this.$store.dispatch('resetPoslanci');
      } else {
        this.timeoutCallback = setTimeout(async () => {
          await this.searchApiRequest();
        }, 200);
      }
    },
    async searchApiRequest() {
      try {
        this.isLoading = true;
        // do search via API
        this.currentQuery = {
          ...this.defaultQuery,
          Jmeno: [`"${this.searchQuery}"`],
        };
        await this.$store.dispatch('getPoslanciSearchAll', this.currentQueryStringified);
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },
    searchNavHandler(e) {
      const searchNavToggle = !this.searchNavStatus;
      this.$store.dispatch('searchNavToggle', { searchState: searchNavToggle });
      if (!searchNavToggle) {
        this.resetSearch();
      }
    },
    resetSearch() {
      this.$store.dispatch('resetPoslanciSearch');
      this.searchQuery = null;
    },
  },
  head() {
    return {
      bodyAttrs: {
        class: this.searchNavStatus ? 'is-search-open' : 'is-search-close',
      },
      // htmlAttrs: {
      //   class: this.searchNavStatus ? "is-search-open" : "is-search-close",
      // },
    };
  },
};
</script>
