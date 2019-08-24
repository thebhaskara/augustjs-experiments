import { expect, assert } from 'chai';
import { Model } from '../src/Model';

describe('Model', function () {

    let model;

    describe('instance', function () {

        it('Should create instance', function () {
            model = new Model();
        });

        it('Should be Model instance', function () {
            expect(model).to.be.an.instanceof(Model);
        });
    });

    describe('basic operations', function () {

        it('Should be able to set without error', function () {
            model.set('a', 10);
            expect(model.state.a).to.be.equal(10);
        });

        it('Should be able to get without error', function () {
            expect(model.get('a')).to.be.equal(model.state.a);
            expect(model.get('a')).to.be.equal(10);
        });

        let value = 1
        let watch

        it('Should be able to watch without error', function () {
            watch = model.watch('a', (a) => value = a);
            expect(value).to.be.equal(model.state.a);
            expect(value).to.be.equal(10);
        });

        it('Should be able to watch when new set happens, without error', function () {
            model.set('a', 20)
            expect(value).to.be.equal(model.state.a);
            expect(value).to.be.equal(20);
        });

        it('Should be able to unwatch without error', function () {
            model.unwatch(watch);
            model.set('a', 200)
            expect(model.state.a).to.be.equal(200);
            expect(value).to.not.be.equal(model.state.a);
            expect(value).to.be.equal(20);
        });

        it('Should be able to destroy', function () {
            let value = false;
            model.watch('a', (a) => { value = a });
            model.destroy();
            model.set('a', 200)
            expect(model.state.a).to.be.equal(200);
            expect(value).to.be.equal(model.state.a);
            expect(value).to.be.equal(200);
        });
    });

    describe('basic operations', function () {

    });
});