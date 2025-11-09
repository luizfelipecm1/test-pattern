import { CheckoutService } from '../src/services/CheckoutService.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { UserMother } from './builders/UserMother.js';
import { Pedido } from '../src/domain/Pedido.js';
import { Item } from '../src/domain/Item.js';

describe('CheckoutService', () => {
    
    let checkoutService;
    let gatewayStub;
    let repositoryStub;
    let emailMock;

    // Cartão de crédito fictício para os testes
    const cartaoCredito = { numero: '1234-5678-9012-3456', cvv: '123' };

    // Setup comum: Cria o SUT (System Under Test) e seus Test Doubles
    beforeEach(() => {
        // Criamos "dublês" para todas as dependências externas.
        // Usamos jest.fn() para simular seus métodos.

        // Stub para o Gateway: Controla o fluxo de pagamento [cite: 65, 76]
        gatewayStub = {
            cobrar: jest.fn() 
        };

        // Stub para o Repositório: Fornece um "pedido salvo" 
        repositoryStub = {
            salvar: jest.fn()
        };

        // Mock para o EmailService: Verificaremos o comportamento 
        emailMock = {
            enviarEmail: jest.fn()
        };

        // Injeta os dublês no serviço
        checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);
    });

    // Etapa 4: Teste com Stub (Verificação de Estado)
    describe('quando o pagamento falha', () => {
        it('deve retornar null e não deve salvar ou enviar e-mail', async () => {
            // Arrange (Organizar) [cite: 61]
            const carrinho = new CarrinhoBuilder().build();
            
            // Configura o Stub para simular falha [cite: 64, 65]
            gatewayStub.cobrar.mockResolvedValue({ success: false, error: 'Pagamento recusado' });

            // Act (Agir) [cite: 67]
            const pedido = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert (Verificar)
            // 1. Verificação de Estado: O resultado deve ser nulo [cite: 68, 69]
            expect(pedido).toBeNull();
            
            // 2. Verificação de Comportamento: Garante que os outros serviços
            // (efeitos colaterais) não foram acionados.
            expect(repositoryStub.salvar).not.toHaveBeenCalled();
            expect(emailMock.enviarEmail).not.toHaveBeenCalled();
        });
    });

    // Teste de Sucesso (Cliente Padrão) - Verificação de Estado
    describe('quando um cliente Padrão finaliza a compra', () => {
        it('deve cobrar o valor integral e retornar o pedido salvo', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comItens([new Item('Item 1', 100), new Item('Item 2', 50)]) // Total R$ 150
                .build();
            
            const pedidoEsperado = new Pedido(1, carrinho, 150, 'PROCESSADO');

            // Configura Stubs para o caminho de sucesso
            gatewayStub.cobrar.mockResolvedValue({ success: true });
            repositoryStub.salvar.mockResolvedValue(pedidoEsperado);
            
            // Act
            const pedidoSalvo = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert (Verificação de Estado)
            // Verifica se o objeto retornado é o esperado
            expect(pedidoSalvo).toBe(pedidoEsperado);
            expect(pedidoSalvo.totalFinal).toBe(150);
            
            // Assert (Verificação de Comportamento)
            // Garante que o gateway foi chamado com o valor CORRETO (sem desconto)
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(150, cartaoCredito);
        });
    });

    // Etapa 5: Teste com Mock (Verificação de Comportamento)
    describe('quando um cliente Premium finaliza a compra', () => {
        
        let usuarioPremium;
        let carrinhoPremium;
        let pedidoSalvoEsperado;

        beforeEach(() => {
            // Arrange [cite: 73]
            usuarioPremium = UserMother.umUsuarioPremium(); // [cite: 74]
            
            carrinhoPremium = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Item Caro 1', 100), new Item('Item Caro 2', 100)]) // Total R$ 200 [cite: 75]
                .build();
            
            // Pedido esperado com ID (simulando o retorno do DB) e desconto
            pedidoSalvoEsperado = new Pedido(123, carrinhoPremium, 180, 'PROCESSADO');

            // Configura Stubs para o caminho de sucesso 
            gatewayStub.cobrar.mockResolvedValue({ success: true });
            repositoryStub.salvar.mockResolvedValue(pedidoSalvoEsperado);
        });

        it('deve aplicar o desconto de 10% no Gateway (Mock)', async () => {
            // Act [cite: 78]
            await checkoutService.processarPedido(carrinhoPremium, cartaoCredito);

            // Assert (Verificação de Comportamento) [cite: 79]
            // Verifica se o gateway (nosso Mock) foi chamado com o valor
            // correto (R$ 180,00, que é 200 * 0.90).
            const valorComDesconto = 180;
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(valorComDesconto, cartaoCredito);
            expect(gatewayStub.cobrar).toHaveBeenCalledTimes(1);
        });

        it('deve enviar o e-mail de confirmação correto (Mock)', async () => {
            // Act [cite: 78]
            await checkoutService.processarPedido(carrinhoPremium, cartaoCredito);

            // Assert (Verificação de Comportamento) [cite: 79]
            // Verifica se o EmailService (nosso Mock) foi chamado,
            // e com os argumentos corretos.
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1); // [cite: 84]
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com', // 
                'Seu Pedido foi Aprovado!', // 
                `Pedido ${pedidoSalvoEsperado.id} no valor de R$${pedidoSalvoEsperado.totalFinal}`
            );
        });
    });
});