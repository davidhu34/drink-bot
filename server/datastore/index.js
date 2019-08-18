const { Datastore } = require('@google-cloud/datastore');
const { GCLOUD_KEY_FILE_NAME } = require('../configs');
const { GCLOUD_PROJECT_ID } = require('../consts');

const datastore = new Datastore({
    projectId: GCLOUD_PROJECT_ID,
    keyFilename: `${__dirname}/${GCLOUD_KEY_FILE_NAME}`
});

const dsPromise = (run) => new Promise(run).catch( err => console.log(err) );

const dsQuery = (kind) => datastore.createQuery(kind);
const dsKey = (kind, id) => datastore.key([kind, Number(id) || id]);
const dsKindKey = (kind) => datastore.key(kind);

const dsSave = (entity) => dsPromise( (resolve, reject) => {
    datastore.save(entity, (err) => {
        if (err) reject(err);
        else resolve(entity);
    });
});

const dsDelete = (kind, id) => dsPromise( (resolve, reject) => {
    datastore.delete(dsKey(kind, id), (err) => {
        if (err) reject(err);
        else resolve(id);
    });
});

const runQuery = (query) => dsPromise( (resolve, reject) => {
    datastore.runQuery(query, (err, entities) => {
        if (err) reject(err);
        else resolve(entities);
    });
});

const searchKey = (key) => dsPromise( (resolve, reject) => {
    datastore.get(key, (err, entity) => {
        if (err) reject(err);
        else resolve(entity);
    });
});

const getKindById = (kind, id) => searchKey(dsKey(kind,id));

module.exports = {
    datastore: datastore,
    KEY: datastore.KEY,
    entityToData: (entity) => ({
        ...entity.data,
        [datastore.KEY]: entity.key
    }),
    getKey: (entity) => entity[datastore.KEY].id.toString(),
    getCarts: () => runQuery(dsQuery('Cart')),
    saveCart: (cart) => dsSave({
        key: dsKindKey('Cart'),
        data: cart
    }),
    getCartById: (id) => getKindById('Cart', id),
    getShops: () => runQuery(dsQuery('Shop')),
    getShopById: (id) => getKindById('Shop', id),
    saveUserProfile: profile => dsSave({
        key: dsKey('User',profile.userId),
        excludeFromIndexes: [
            'displayName',
            'pictureUrl',
            'statusMessage',
        ],
        data: profile
    }),
    saveOrder: order => dsSave({
        key: dsKindKey('Order'),
        data: order
    }),
    deleteOrder: (orderId) => dsDelete('Order',orderId),
    getUserOrderInCart: (userId,cartId) => {
        const query = datastore.createQuery('Order');
        query.filter('userId', userId);
        query.filter('cartId', cartId);
        return runQuery(query);
    }
};