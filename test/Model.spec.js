import { expect } from 'chai';
import { Model } from '../src/Model';

describe('Model', function () {

    describe('instance', function () {

        it('Should create instance', function () {
            new Model();
        });

        it('Should be Model instance', function () {
            let model = new Model();
            expect(model).to.be.an.instanceof(Model);
        });
    });

    describe('basic operations', function () {

        it('Should be able to set without error', function () {
            let model = new Model();
            model.set('a', 10);
            expect(model.state.a).to.be.equal(10);
        });

        it('Should be able to get without error', function () {
            let model = new Model();
            model.set('a', 10);
            expect(model.get('a')).to.be.equal(model.state.a);
            expect(model.get('a')).to.be.equal(10);
        });


        it('Should be able to watch without error', function () {
            let model = new Model();
            let value = 1
            let watch = model.watch('a', (a) => value = a);
            model.set('a', 10);
            expect(value).to.be.equal(model.state.a);
            expect(value).to.be.equal(10);
        });

        it('Should be able to watch when new set happens, without error', function () {
            let model = new Model();
            let value = 1
            let watch = model.watch('a', (a) => value = a);
            model.set('a', 20)
            expect(value).to.be.equal(model.state.a);
            expect(value).to.be.equal(20);
        });

        it('Should be able to unwatch without error', function () {
            let model = new Model();
            let value = 1
            let watch = model.watch('a', (a) => value = a);
            model.set('a', 20)
            model.unwatch(watch);
            model.set('a', 200)
            expect(model.state.a).to.be.equal(200);
            expect(value).to.not.be.equal(model.state.a);
            expect(value).to.be.equal(20);
        });

        it('Should be able to destroy', function () {
            let model = new Model();
            let value = 1
            model.watch('a', (a) => { value = a });
            model.destroy();
            model.set('a', 200)
            expect(model.state.a).to.be.equal(200);
            expect(value).to.not.be.equal(model.state.a);
            expect(value).to.be.equal(1);
        });
    });

    describe('watch operations', function () {

        it('Should be able to trigger watch if already has value', function () {
            let _a;
            let model = new Model();
            model.set('a', 199)
            model.watch('a', (a) => { _a = a });
            expect(model.state.a).to.be.equal(199);
            expect(_a).to.be.equal(model.state.a);
            expect(_a).to.be.equal(199);
        });

        it('Should be able to do object watch', function () {
            let _ab;
            let model = new Model();
            model.watch('a.b', (ab) => { _ab = ab });
            model.set('a.b', 199)
            expect(model.state.a.b).to.be.equal(199);
            expect(_ab).to.be.equal(model.state.a.b);
            expect(_ab).to.be.equal(199);
        });

        it('Should not trigger unmatching paths', function () {
            let _ab = false;
            let model = new Model();
            model.watch('a.b', (ab) => { _ab = ab });
            model.set('aa', 199)
            expect(_ab).to.be.equal(false);
            model.set('a.bb', 199)
            expect(_ab).to.be.equal(false);
            model.set('aa.bb', 199)
            expect(_ab).to.be.equal(false);
        });

        it('Should trigger parents', function () {
            let _a = false;
            let _ab = false;
            let _abc = false;
            let model = new Model();
            model.watch('a.b.c', (abc) => { _abc = abc });
            model.watch('a.b', (ab) => { _ab = ab });
            model.watch('a', (a) => { _a = a });
            model.set('a.b.c', 199)
            expect(model.state.a.b.c).to.be.equal(199);
            expect(model.state.a.b.c).to.be.equal(_abc);
            expect(model.state.a.b).to.be.equal(_ab);
            expect(model.state.a).to.be.equal(_a);
        });

        it('Should trigger children', function () {
            let _a = false;
            let _ab = false;
            let _abc = false;
            let model = new Model();
            model.watch('a.b.c', (abc) => { _abc = abc });
            model.watch('a.b', (ab) => { _ab = ab });
            model.watch('a', (a) => { _a = a });
            model.set('a', { b: { c: 199 } });
            expect(model.state.a.b.c).to.be.equal(199);
            expect(model.state.a.b.c).to.be.equal(_abc);
            expect(model.state.a.b).to.be.equal(_ab);
            expect(model.state.a).to.be.equal(_a);
        });

    });

    describe('Watching other models', function(){


        it('Should be able to trigger watch if already has value', function () {
            let _a;
            let model = new Model();
            let anotherModel = new Model();
            anotherModel.set('a', 199)
            model.watch(anotherModel, 'a', (a) => { _a = a });
            expect(anotherModel.state.a).to.be.equal(199);
            expect(_a).to.be.equal(anotherModel.state.a);
            expect(_a).to.be.equal(199);
        });

        it('Should be able to do object watch', function () {
            let _ab;
            let model = new Model();
            let anotherModel = new Model();
            model.watch(anotherModel, 'a.b', (ab) => { _ab = ab });
            anotherModel.set('a.b', 199)
            expect(anotherModel.state.a.b).to.be.equal(199);
            expect(_ab).to.be.equal(anotherModel.state.a.b);
            expect(_ab).to.be.equal(199);
        });

        it('Should not trigger unmatching paths', function () {
            let _ab = false;
            let model = new Model();
            let anotherModel = new Model();
            model.watch(anotherModel, 'a.b', (ab) => { _ab = ab });
            anotherModel.set('aa', 199)
            expect(_ab).to.be.equal(false);
            anotherModel.set('a.bb', 199)
            expect(_ab).to.be.equal(false);
            anotherModel.set('aa.bb', 199)
            expect(_ab).to.be.equal(false);
        });

        it('Should trigger parents', function () {
            let _a = false;
            let _ab = false;
            let _abc = false;
            let model = new Model();
            let anotherModel = new Model();
            model.watch(anotherModel, 'a.b.c', (abc) => { _abc = abc });
            model.watch(anotherModel, 'a.b', (ab) => { _ab = ab });
            model.watch(anotherModel, 'a', (a) => { _a = a });
            anotherModel.set('a.b.c', 199)
            expect(anotherModel.state.a.b.c).to.be.equal(199);
            expect(anotherModel.state.a.b.c).to.be.equal(_abc);
            expect(anotherModel.state.a.b).to.be.equal(_ab);
            expect(anotherModel.state.a).to.be.equal(_a);
        });

        it('Should trigger children', function () {
            let _a = false;
            let _ab = false;
            let _abc = false;
            let model = new Model();
            let anotherModel = new Model();
            model.watch(anotherModel, 'a.b.c', (abc) => { _abc = abc });
            model.watch(anotherModel, 'a.b', (ab) => { _ab = ab });
            model.watch(anotherModel, 'a', (a) => { _a = a });
            anotherModel.set('a', { b: { c: 199 } });
            expect(anotherModel.state.a.b.c).to.be.equal(199);
            expect(anotherModel.state.a.b.c).to.be.equal(_abc);
            expect(anotherModel.state.a.b).to.be.equal(_ab);
            expect(anotherModel.state.a).to.be.equal(_a);
        });

    })
});