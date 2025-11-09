import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Implementação do Padrão Data Builder.
 * Resolve o Test Smell de "Setup Obscuro" permitindo
 * a criação fluente e customizável de objetos complexos como o Carrinho.
 */
export class CarrinhoBuilder {
    constructor() {
        // Valores padrão: um carrinho com um usuário padrão
        // e um item de R$ 100,00.
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Item Padrão', 100)];
    }

    /**
     * Define o usuário do carrinho.
     * @param {User} user O usuário.
     * @returns {CarrinhoBuilder} A própria instância do builder (API fluente).
     */
    comUser(user) {
        this.user = user;
        return this; //
    }

    /**
     * Define os itens do carrinho.
     * @param {Item[]} itens A lista de itens.
     * @returns {CarrinhoBuilder} A própria instância do builder.
     */
    comItens(itens) {
        this.itens = itens;
        return this; //
    }

    /**
     * Define o carrinho como vazio (sem itens).
     * @returns {CarrinhoBuilder} A própria instância do builder.
     */
    vazio() {
        this.itens = [];
        return this; //
    }

    /**
     * Constrói a instância final do Carrinho com os dados definidos.
     * @returns {Carrinho} A instância do Carrinho.
     */
    build() {
        return new Carrinho(this.user, this.itens); //
    }
}