import _find from 'lodash/find';
import React, { useEffect, useState } from 'react';
import { Form, Field } from 'react-final-form';
import Select from 'react-select';
import { Button } from 'app/components/Buttons';
import Input from 'app/components/FormControl/Input';
import FormGroup from 'app/components/FormGroup';
import Label from 'app/components/Label';
import Margin from 'app/components/Margin';
import Modal from 'app/components/Modal';
import { RadioButton } from 'app/components/Radio';
import i18n from 'app/lib/i18n';
import log from 'app/lib/log';
import useWidgetConfig from 'app/widgets/shared/useWidgetConfig';
import MutedText from '../components/MutedText';
import {
  MEDIA_SOURCE_LOCAL,
  MEDIA_SOURCE_MJPEG,
} from '../constants';

const useVideoDevices = () => {
  const [isEnumeratingDevices, setIsEnumeratingDevices] = useState(true);
  const [videoDevices, setVideoDevices] = useState([]);

  useEffect(() => {
    const enumerateDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        // enumerateDevices() not supported.
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => (device.kind === 'videoinput'));
        setVideoDevices(videoDevices);
        setIsEnumeratingDevices(false);
      } catch (err) {
        log.error(err.name + ': ' + err.message);
      }
    };

    enumerateDevices();
  }, [setVideoDevices]);

  return {
    isEnumeratingDevices,
    videoDevices,
  };
};

const SettingsModal = ({
  onClose,
}) => {
  const config = useWidgetConfig();
  const initialValues = {
    mediaSource: config.get('mediaSource'),
    deviceId: config.get('deviceId'),
    url: config.get('url'),
  };
  const { isEnumeratingDevices, videoDevices } = useVideoDevices();

  return (
    <Modal
      disableOverlayClick
      size="sm"
      onClose={onClose}
    >
      <Form
        initialValues={initialValues}
        onSubmit={(values) => {
          const { mediaSource, deviceId, url } = values;
          config.set('mediaSource', mediaSource);
          config.set('deviceId', deviceId);
          config.set('url', url);
          onClose();
        }}
      >
        {({ form }) => {
          const handleSubmit = () => {
            form.submit();
          };

          return (
            <>
              <Modal.Header>
                <Modal.Title>{i18n._('Webcam Settings')}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <FormGroup>
                  <Label>
                    {i18n._('Media Source')}
                  </Label>
                  <Margin bottom={8}>
                    <Margin bottom={4}>
                      <Field name="mediaSource" type="radio" value={MEDIA_SOURCE_LOCAL}>
                        {({ input }) => (
                          <RadioButton
                            {...input}
                            label={i18n._('Use a built-in camera or a connected webcam')}
                          />
                        )}
                      </Field>
                    </Margin>
                    <Margin left={20}>
                      <Field name="videoDevice">
                        {({ input }) => {
                          const { values } = form.getState();
                          const { mediaSource } = values;
                          const isDisabled = mediaSource !== MEDIA_SOURCE_LOCAL;
                          const isLoading = isEnumeratingDevices;
                          const options = [{
                            value: '__default__',
                            label: i18n._('Automatic detection'),
                          }].concat(videoDevices.map(videoDevice => ({
                            value: videoDevice.deviceId,
                            label: videoDevice.label || videoDevice.deviceId,
                          })));
                          const value = _find(options, { value: input.value }) || null;

                          return (
                            <Select
                              value={value}
                              onChange={(option) => {
                                const { value } = option;
                                input.onChange(value);
                              }}
                              isClearable={false}
                              isDisabled={isDisabled}
                              isLoading={isLoading}
                              isSearchable={false}
                              options={options}
                              placeholder={i18n._('Choose a video device')}
                            />
                          );
                        }}
                      </Field>
                    </Margin>
                  </Margin>
                  <Margin bottom={8}>
                    <Margin bottom={4}>
                      <Field name="mediaSource" type="radio" value={MEDIA_SOURCE_MJPEG}>
                        {({ input }) => (
                          <RadioButton
                            {...input}
                            label={i18n._('Connect to an IP camera')}
                          />
                        )}
                      </Field>
                    </Margin>
                    <Margin left={20}>
                      <Field name="url">
                        {({ input, meta }) => {
                          const { values } = form.getState();
                          const { mediaSource } = values;
                          const isDisabled = mediaSource !== MEDIA_SOURCE_MJPEG;

                          return (
                            <Input
                              {...input}
                              type="url"
                              disabled={isDisabled}
                              placeholder="http://0.0.0.0:8080/?action=stream"
                            />
                          );
                        }}
                      </Field>
                      <Margin top={4}>
                        <MutedText>
                          {i18n._('The URL must be for a Motion JPEG (mjpeg) HTTP or RTSP stream.')}
                        </MutedText>
                      </Margin>
                    </Margin>
                  </Margin>
                </FormGroup>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  btnStyle="default"
                  onClick={onClose}
                >
                  {i18n._('Cancel')}
                </Button>
                <Button
                  btnStyle="primary"
                  onClick={handleSubmit}
                >
                  {i18n._('Save Changes')}
                </Button>
              </Modal.Footer>
            </>
          );
        }}
      </Form>
    </Modal>
  );
};

export default SettingsModal;